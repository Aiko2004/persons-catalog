import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, EMPTY, Subject } from 'rxjs';
import { catchError, startWith, switchMap, tap } from 'rxjs/operators';
import { AppError } from '../../core/models/api.model';
import { PersonDetailResponse } from '../../core/models/person.model';
import { PersonService } from '../../core/services/person.service';
import { formatYearRange, personInitials } from '../../core/utils/person.utils';

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

  readonly person = signal<PersonDetailResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal<AppError | null>(null);
  readonly showDeleteConfirm = signal(false);
  readonly deleting = signal(false);
  readonly deleteError = signal<string | null>(null);

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

  private readonly retry$ = new Subject<void>();

  ngOnInit(): void {
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
}
