import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, EMPTY, Subject } from 'rxjs';
import { catchError, startWith, switchMap, tap } from 'rxjs/operators';
import { AppError } from '../../core/models/api.model';
import { PersonDetailResponse } from '../../core/models/person.model';
import { PersonService } from '../../core/services/person.service';
import { formatYearRange, personInitials } from '../../core/utils/person.utils';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-person-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './person-detail.component.html',
  styleUrl: './person-detail.component.scss',
})
export class PersonDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly personService = inject(PersonService);

  // ─── Мұғалім ───────────────────────────────────────────────────────────
  readonly person = signal<PersonDetailResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal<AppError | null>(null);

  readonly lifeYears = computed(() => {
    const p = this.person();
    return p ? formatYearRange(p.birthYear, p.deathYear) : null;
  });
  readonly workYears = computed(() => {
    const p = this.person();
    return p ? formatYearRange(p.workStartYear, p.workEndYear) : null;
  });
  readonly initials = computed(() => {
    const p = this.person();
    return p ? personInitials(p.lastName, p.firstName) : '';
  });

  // ─── Фото жүктеу ───────────────────────────────────────────────────────
  readonly selectedFile = signal<File | null>(null);
  readonly previewUrl = signal<string | null>(null);
  readonly photoUploading = signal(false);
  readonly photoError = signal<string | null>(null);

  // ─── Фото өшіру ────────────────────────────────────────────────────────
  readonly showPhotoDeleteConfirm = signal(false);
  readonly photoDeleting = signal(false);

  // ─── Мұғалім өшіру ─────────────────────────────────────────────────────
  readonly showDeleteConfirm = signal(false);
  readonly deleting = signal(false);
  readonly deleteError = signal<string | null>(null);

  private readonly retry$ = new Subject<void>();

  ngOnInit(): void {
    // Объектке URL-ды бостату
    this.destroyRef.onDestroy(() => this.revokePreview());

    combineLatest([this.route.paramMap, this.retry$.pipe(startWith(null as null))])
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
          this.person.set(null);
        }),
        switchMap(([paramMap]) => {
          const id = paramMap.get('id')!;
          return this.personService.getPerson(id).pipe(
            catchError((err: AppError) => {
              this.error.set(err);
              this.loading.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((person) => {
        this.person.set(person);
        this.loading.set(false);
      });
  }

  reload(): void {
    this.retry$.next();
  }

  // ─── Фото жүктеу ───────────────────────────────────────────────────────

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      this.photoError.set('Тек JPG, PNG немесе WebP форматтары қолданылады.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      this.photoError.set('Файл өлшемі 5 МБ-тан аспауы керек.');
      return;
    }

    this.revokePreview();
    this.photoError.set(null);
    this.selectedFile.set(file);
    this.previewUrl.set(URL.createObjectURL(file));
  }

  cancelPhotoSelect(): void {
    this.revokePreview();
    this.selectedFile.set(null);
    this.photoError.set(null);
  }

  uploadPhoto(): void {
    const file = this.selectedFile();
    const p = this.person();
    if (!file || !p) return;

    this.photoUploading.set(true);
    this.photoError.set(null);

    this.personService.uploadPhoto(p.id, file).subscribe({
      next: (updated) => {
        this.person.set(updated);
        this.revokePreview();
        this.selectedFile.set(null);
        this.photoUploading.set(false);
      },
      error: (err: AppError) => {
        this.photoError.set(err.message ?? 'Фото жүктеу мүмкін болмады.');
        this.photoUploading.set(false);
      },
    });
  }

  // ─── Фото өшіру ────────────────────────────────────────────────────────

  openPhotoDeleteConfirm(): void {
    this.showPhotoDeleteConfirm.set(true);
  }

  cancelPhotoDelete(): void {
    this.showPhotoDeleteConfirm.set(false);
  }

  confirmPhotoDelete(): void {
    const p = this.person();
    if (!p) return;

    this.photoDeleting.set(true);

    this.personService.deletePhoto(p.id).subscribe({
      next: () => {
        this.person.update((cur) => (cur ? { ...cur, photoUrl: null } : null));
        this.showPhotoDeleteConfirm.set(false);
        this.photoDeleting.set(false);
      },
      error: (err: AppError) => {
        this.photoDeleting.set(false);
        this.photoError.set(err.message ?? 'Фото өшіру мүмкін болмады.');
        this.showPhotoDeleteConfirm.set(false);
      },
    });
  }

  // ─── Мұғалім өшіру ─────────────────────────────────────────────────────

  openDeleteConfirm(): void {
    this.deleteError.set(null);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
  }

  confirmDelete(): void {
    const p = this.person();
    if (!p) return;

    this.deleting.set(true);
    this.deleteError.set(null);

    this.personService.deletePerson(p.id).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err: AppError) => {
        this.deleting.set(false);
        this.deleteError.set(err.message ?? 'Өшіру мүмкін болмады.');
      },
    });
  }

  // ─── Утилита ───────────────────────────────────────────────────────────

  private revokePreview(): void {
    const url = this.previewUrl();
    if (url) URL.revokeObjectURL(url);
    this.previewUrl.set(null);
  }
}
