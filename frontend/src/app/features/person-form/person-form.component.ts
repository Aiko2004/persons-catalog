import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppError } from '../../core/models/api.model';
import { PersonDetailResponse, PersonRequest } from '../../core/models/person.model';
import { PersonService } from '../../core/services/person.service';
import { SubjectService } from '../../core/services/subject.service';
import { NotificationService } from '../../core/services/notification.service';

function yearOrderValidator(startKey: string, endKey: string, errorKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const start = group.get(startKey)?.value as number | null;
    const end = group.get(endKey)?.value as number | null;
    if (start != null && end != null && end < start) {
      return { [errorKey]: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-person-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './person-form.component.html',
  styleUrl: './person-form.component.scss',
})
export class PersonFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly personService = inject(PersonService);
  private readonly subjectService = inject(SubjectService);
  private readonly notificationService = inject(NotificationService);

  readonly isEditMode = signal(false);
  private personId: string | null = null;

  readonly pageLoading = signal(false);
  readonly saving = signal(false);
  readonly submitted = signal(false);
  readonly saveError = signal<string | null>(null);

  readonly subjects = this.subjectService.subjects;

  readonly form = new FormGroup(
    {
      lastName: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(100)],
      }),
      firstName: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(100)],
      }),
      middleName: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(100)],
      }),
      birthYear: new FormControl<number | null>(null, {
        validators: [Validators.min(1850), Validators.max(2100)],
      }),
      deathYear: new FormControl<number | null>(null, {
        validators: [Validators.min(1850), Validators.max(2100)],
      }),
      workStartYear: new FormControl<number | null>(null, {
        validators: [Validators.min(1850), Validators.max(2100)],
      }),
      workEndYear: new FormControl<number | null>(null, {
        validators: [Validators.min(1850), Validators.max(2100)],
      }),
      description: new FormControl('', { nonNullable: true }),
      verified: new FormControl(false, { nonNullable: true }),
      subjectIds: new FormControl<string[]>([], { nonNullable: true }),
    },
    {
      validators: [
        yearOrderValidator('birthYear', 'deathYear', 'deathBeforeBirth'),
        yearOrderValidator('workStartYear', 'workEndYear', 'workEndBeforeStart'),
      ],
    },
  );

  ngOnInit(): void {
    this.personId = this.route.snapshot.paramMap.get('id');
    this.isEditMode.set(this.personId !== null);

    this.subjectService.loadSubjects().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();

    if (this.personId) {
      this.pageLoading.set(true);
      this.form.disable();

      this.personService
        .getPerson(this.personId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (person) => {
            this.patchForm(person);
            this.form.enable();
            this.pageLoading.set(false);
          },
          error: () => {
            this.router.navigate(['/']);
          },
        });
    }
  }

  private patchForm(person: PersonDetailResponse): void {
    this.form.patchValue({
      lastName: person.lastName,
      firstName: person.firstName,
      middleName: person.middleName ?? '',
      birthYear: person.birthYear,
      deathYear: person.deathYear,
      workStartYear: person.workStartYear,
      workEndYear: person.workEndYear,
      description: person.description ?? '',
      verified: person.verified,
      subjectIds: person.subjects.map((s) => s.id),
    });
  }

  fieldError(name: string): string | null {
    const ctrl = this.form.get(name);
    if (!ctrl || !ctrl.invalid || !ctrl.touched) return null;
    const e = ctrl.errors!;
    if (e['server']) return e['server'] as string;
    if (e['required']) return 'Міндетті өріс';
    if (e['min']) return `Жыл ${(e['min'] as { min: number }).min}-дан кіші болмауы керек`;
    if (e['max']) return `Жыл ${(e['max'] as { max: number }).max}-дан үлкен болмауы керек`;
    if (e['maxlength'])
      return `Ең көп ${(e['maxlength'] as { requiredLength: number }).requiredLength} таңба`;
    return 'Қате мән';
  }

  isSubjectSelected(id: string): boolean {
    return this.form.controls.subjectIds.value.includes(id);
  }

  toggleSubject(id: string): void {
    const ctrl = this.form.controls.subjectIds;
    const current = ctrl.value;
    ctrl.setValue(
      current.includes(id) ? current.filter((s) => s !== id) : [...current, id],
    );
    ctrl.markAsDirty();
  }

  submit(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.saving.set(true);
    this.saveError.set(null);

    const req = this.buildRequest();
    const save$ = this.personId
      ? this.personService.updatePerson(this.personId, req)
      : this.personService.createPerson(req);

    save$.subscribe({
      next: (person) => {
        this.notificationService.show('Мұғалім сәтті сақталды.');
        this.router.navigate(['/persons', person.id]);
      },
      error: (err: AppError) => {
        this.saving.set(false);
        if (err.status === 400 && Object.keys(err.fields).length > 0) {
          for (const [field, message] of Object.entries(err.fields)) {
            const ctrl = this.form.get(field);
            if (ctrl) {
              ctrl.setErrors({ server: message });
              ctrl.markAsTouched();
            }
          }
        } else {
          this.saveError.set(err.message ?? 'Сақтау мүмкін болмады.');
        }
      },
    });
  }

  cancel(): void {
    if (this.personId) {
      this.router.navigate(['/persons', this.personId]);
    } else {
      this.router.navigate(['/']);
    }
  }

  private buildRequest(): PersonRequest {
    const v = this.form.getRawValue();
    return {
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim(),
      ...(v.middleName.trim() ? { middleName: v.middleName.trim() } : {}),
      ...(v.birthYear != null ? { birthYear: v.birthYear } : {}),
      ...(v.deathYear != null ? { deathYear: v.deathYear } : {}),
      ...(v.workStartYear != null ? { workStartYear: v.workStartYear } : {}),
      ...(v.workEndYear != null ? { workEndYear: v.workEndYear } : {}),
      ...(v.description.trim() ? { description: v.description.trim() } : {}),
      verified: v.verified,
      subjectIds: v.subjectIds,
    };
  }
}
