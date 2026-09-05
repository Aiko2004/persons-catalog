import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EMPTY, Subject } from 'rxjs';
import { catchError, startWith, switchMap, tap } from 'rxjs/operators';
import { AppError } from '../../core/models/api.model';
import { SubjectResponse } from '../../core/models/subject.model';
import { SubjectService } from '../../core/services/subject.service';

@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './subjects.component.html',
  styleUrl: './subjects.component.scss',
})
export class SubjectsComponent implements OnInit {
  private readonly subjectService = inject(SubjectService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly retry$ = new Subject<void>();

  readonly loading = signal(true);
  readonly error = signal<AppError | null>(null);
  readonly subjects = this.subjectService.subjects;

  // ─── Модальдық терезе (жасау / өңдеу) ────────────────────────────────────
  readonly modalOpen = signal(false);
  readonly editTarget = signal<SubjectResponse | null>(null);
  readonly modalSaving = signal(false);
  readonly modalError = signal<string | null>(null);

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    description: new FormControl('', { nonNullable: true }),
  });

  // ─── Өшіру ────────────────────────────────────────────────────────────────
  readonly deleteTarget = signal<SubjectResponse | null>(null);
  readonly deleteForceMessage = signal<string | null>(null);
  readonly deleting = signal(false);

  ngOnInit(): void {
    this.retry$
      .pipe(
        startWith(null as null),
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(() =>
          this.subjectService.loadSubjects().pipe(
            catchError((err: AppError) => {
              this.error.set(err);
              this.loading.set(false);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.loading.set(false));
  }

  reload(): void {
    this.retry$.next();
  }

  // ─── Модальдық терезе ─────────────────────────────────────────────────────

  openCreate(): void {
    this.editTarget.set(null);
    this.form.reset();
    this.modalError.set(null);
    this.modalOpen.set(true);
  }

  openEdit(subject: SubjectResponse): void {
    this.editTarget.set(subject);
    this.form.patchValue({ name: subject.name, description: subject.description ?? '' });
    this.form.markAsUntouched();
    this.modalError.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    if (this.modalSaving()) return;
    this.modalOpen.set(false);
  }

  saveModal(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.modalSaving.set(true);
    this.modalError.set(null);

    const v = this.form.getRawValue();
    const req = {
      name: v.name.trim(),
      ...(v.description.trim() ? { description: v.description.trim() } : {}),
    };

    const target = this.editTarget();
    const save$ = target
      ? this.subjectService.updateSubject(target.id, req)
      : this.subjectService.createSubject(req);

    save$.subscribe({
      next: () => {
        this.modalSaving.set(false);
        this.modalOpen.set(false);
        this.refreshList();
      },
      error: (err: AppError) => {
        this.modalSaving.set(false);
        this.modalError.set(err.message ?? 'Сақтау мүмкін болмады.');
      },
    });
  }

  nameError(): string | null {
    const ctrl = this.form.controls.name;
    if (!ctrl.invalid || !ctrl.touched) return null;
    if (ctrl.errors?.['required']) return 'Міндетті өріс';
    if (ctrl.errors?.['maxlength']) return 'Ең көп 100 таңба';
    return 'Қате мән';
  }

  // ─── Өшіру ────────────────────────────────────────────────────────────────

  openDelete(subject: SubjectResponse): void {
    this.deleteTarget.set(subject);
    this.deleteForceMessage.set(null);
  }

  cancelDelete(): void {
    if (this.deleting()) return;
    this.deleteTarget.set(null);
    this.deleteForceMessage.set(null);
  }

  confirmDelete(force = false): void {
    const target = this.deleteTarget();
    if (!target) return;

    this.deleting.set(true);

    this.subjectService.deleteSubject(target.id, force).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.deleteForceMessage.set(null);
        this.refreshList();
      },
      error: (err: AppError) => {
        this.deleting.set(false);
        if (err.status === 409) {
          this.deleteForceMessage.set(err.message);
        } else {
          // Күтілмеген қате — диалогты жабамыз
          this.deleteTarget.set(null);
          this.deleteForceMessage.set(null);
        }
      },
    });
  }

  // ─── Утилита ──────────────────────────────────────────────────────────────

  private refreshList(): void {
    this.subjectService
      .loadSubjects()
      .pipe(catchError(() => EMPTY), takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
}
