import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, EMPTY, Subject } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  startWith,
  switchMap,
  tap,
} from 'rxjs/operators';
import { AppError } from '../../core/models/api.model';
import { PersonResponse, PersonSortField, SortDirection } from '../../core/models/person.model';
import { PersonService } from '../../core/services/person.service';
import { SubjectService } from '../../core/services/subject.service';
import { PersonCardComponent } from './person-card/person-card.component';

interface SortOption {
  value: PersonSortField;
  label: string;
}

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PersonCardComponent],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
})
export class CatalogComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly personService = inject(PersonService);

  readonly subjectService = inject(SubjectService);

  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly persons = signal<PersonResponse[]>([]);
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly currentSearch = signal('');
  readonly selectedSubjects = signal<string[]>([]);
  readonly currentPage = signal(0);
  readonly currentSort = signal<PersonSortField>('lastName');
  readonly currentDirection = signal<SortDirection>('asc');

  readonly hasActiveFilters = computed(
    () => !!(this.currentSearch() || this.selectedSubjects().length > 0),
  );

  readonly sortOptions: SortOption[] = [
    { value: 'lastName', label: 'Тегі бойынша' },
    { value: 'firstName', label: 'Аты бойынша' },
    { value: 'workStartYear', label: 'Жұмыс басталды' },
    { value: 'workEndYear', label: 'Жұмыс аяқталды' },
    { value: 'birthYear', label: 'Туған жылы' },
    { value: 'createdAt', label: 'Қосылған уақыты' },
  ];

  private readonly retry$ = new Subject<void>();

  ngOnInit(): void {
    this.subjectService.loadSubjects().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();

    // Іздеу жолағы → URL жаңарту (debounce арқылы)
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((search) => this.navigate({ search: search || null, page: 0 }));

    // URL өзгерісі немесе «Қайталау» → мұғалімдерді жүктеу
    combineLatest([this.route.queryParamMap, this.retry$.pipe(startWith(null as null))])
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(([paramMap]) => {
          const search = paramMap.get('search') ?? '';
          if (this.searchControl.value !== search) {
            this.searchControl.setValue(search, { emitEvent: false });
          }
          this.currentSearch.set(search);
          this.selectedSubjects.set(paramMap.getAll('subject'));
          this.currentPage.set(+(paramMap.get('page') ?? 0));
          this.currentSort.set((paramMap.get('sort') ?? 'lastName') as PersonSortField);
          this.currentDirection.set((paramMap.get('direction') ?? 'asc') as SortDirection);

          return this.personService
            .getPersons({
              search: search || undefined,
              subject: paramMap.getAll('subject'),
              page: +(paramMap.get('page') ?? 0),
              sort: (paramMap.get('sort') ?? 'lastName') as PersonSortField,
              direction: (paramMap.get('direction') ?? 'asc') as SortDirection,
            })
            .pipe(
              catchError((err: AppError) => {
                this.error.set(err.message ?? 'Деректерді жүктеу мүмкін болмады.');
                this.loading.set(false);
                return EMPTY;
              }),
            );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((page) => {
        this.persons.set(page.content);
        this.totalElements.set(page.totalElements);
        this.totalPages.set(page.totalPages);
        this.loading.set(false);
      });
  }

  isSubjectSelected(id: string): boolean {
    return this.selectedSubjects().includes(id);
  }

  toggleSubject(id: string): void {
    const current = this.selectedSubjects();
    const updated = current.includes(id)
      ? current.filter((s) => s !== id)
      : [...current, id];
    this.navigate({ subject: updated, page: 0 });
  }

  onSortFieldChange(event: Event): void {
    const sort = (event.target as HTMLSelectElement).value as PersonSortField;
    this.navigate({ sort, direction: 'asc', page: 0 });
  }

  toggleDirection(): void {
    this.navigate({ direction: this.currentDirection() === 'asc' ? 'desc' : 'asc', page: 0 });
  }

  goToPage(page: number): void {
    this.navigate({ page });
  }

  reload(): void {
    this.retry$.next();
  }

  private navigate(
    overrides: Partial<{
      search: string | null;
      subject: string[];
      sort: PersonSortField;
      direction: SortDirection;
      page: number;
    }>,
  ): void {
    const search = 'search' in overrides ? overrides.search : this.currentSearch();
    const subject = 'subject' in overrides ? overrides.subject : this.selectedSubjects();
    const sort = 'sort' in overrides ? overrides.sort : this.currentSort();
    const direction = 'direction' in overrides ? overrides.direction : this.currentDirection();
    const page = 'page' in overrides ? overrides.page : this.currentPage();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: search || null,
        subject: subject?.length ? subject : null,
        sort: sort !== 'lastName' ? sort : null,
        direction: direction !== 'asc' ? direction : null,
        page: page ? page : null,
      },
      queryParamsHandling: 'replace',
    });
  }
}
