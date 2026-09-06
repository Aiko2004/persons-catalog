import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, EMPTY, forkJoin, of, Subject } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
  switchMap,
  tap,
} from 'rxjs/operators';
import { AppError } from '../../core/models/api.model';
import { PersonResponse, PersonSortField, SortDirection } from '../../core/models/person.model';
import { PersonService } from '../../core/services/person.service';
import { SubjectService } from '../../core/services/subject.service';
import { formatYearRange } from '../../core/utils/person.utils';
import { PersonCardComponent } from './person-card/person-card.component';

type ViewMode = 'cards' | 'table';

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
  readonly exporting = signal(false);

  readonly currentView = signal<ViewMode>('cards');
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

    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((search) => this.navigate({ search: search || null, page: 0 }));

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
          const view = (paramMap.get('view') ?? 'cards') as ViewMode;
          this.currentView.set(view);
          this.currentSearch.set(search);
          this.selectedSubjects.set(paramMap.getAll('subject'));
          this.currentPage.set(+(paramMap.get('page') ?? 0));
          this.currentSort.set((paramMap.get('sort') ?? 'lastName') as PersonSortField);
          this.currentDirection.set((paramMap.get('direction') ?? 'asc') as SortDirection);

          const size = view === 'table' ? 100 : 20;

          return this.personService
            .getPersons({
              search: search || undefined,
              subject: paramMap.getAll('subject'),
              page: +(paramMap.get('page') ?? 0),
              size,
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
    const updated = current.includes(id) ? current.filter((s) => s !== id) : [...current, id];
    this.navigate({ subject: updated, page: 0 });
  }

  onSortFieldChange(event: Event): void {
    const sort = (event.target as HTMLSelectElement).value as PersonSortField;
    this.navigate({ sort, direction: 'asc', page: 0 });
  }

  toggleDirection(): void {
    this.navigate({ direction: this.currentDirection() === 'asc' ? 'desc' : 'asc', page: 0 });
  }

  setView(view: ViewMode): void {
    this.navigate({ view, page: 0 });
  }

  goToPage(page: number): void {
    this.navigate({ page });
  }

  openPerson(id: string): void {
    this.router.navigate(['/persons', id]);
  }

  reload(): void {
    this.retry$.next();
  }

  formatWorkYears(person: PersonResponse): string | null {
    return formatYearRange(person.workStartYear, person.workEndYear);
  }

  exportCsv(): void {
    this.exporting.set(true);

    const baseParams = {
      search: this.currentSearch() || undefined,
      subject: this.selectedSubjects(),
      sort: this.currentSort(),
      direction: this.currentDirection(),
      size: 100,
      page: 0,
    };

    this.personService
      .getPersons(baseParams)
      .pipe(
        switchMap((firstPage) => {
          if (firstPage.totalPages <= 1) {
            return of(firstPage.content);
          }
          const rest = Array.from({ length: firstPage.totalPages - 1 }, (_, i) =>
            this.personService.getPersons({ ...baseParams, page: i + 1 }),
          );
          return forkJoin(rest).pipe(
            map((pages) => [...firstPage.content, ...pages.flatMap((p) => p.content)]),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (all) => {
          this.downloadCsv(all);
          this.exporting.set(false);
        },
        error: () => this.exporting.set(false),
      });
  }

  private downloadCsv(persons: PersonResponse[]): void {
    const header = [
      'Тегі',
      'Аты',
      'Әкесінің аты',
      'Жұмыс басталды',
      'Жұмыс аяқталды',
      'Пәндер',
      'Тексерілген',
    ];

    const rows = persons.map((p) => [
      p.lastName,
      p.firstName,
      p.middleName ?? '',
      p.workStartYear?.toString() ?? '',
      p.workEndYear?.toString() ?? '',
      p.subjects.map((s) => s.name).join('; '),
      p.verified ? 'иә' : 'жоқ',
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const BOM = '﻿';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `mugalimder-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private navigate(
    overrides: Partial<{
      search: string | null;
      subject: string[];
      sort: PersonSortField;
      direction: SortDirection;
      page: number;
      view: ViewMode;
    }>,
  ): void {
    const search = 'search' in overrides ? overrides.search : this.currentSearch();
    const subject = 'subject' in overrides ? overrides.subject : this.selectedSubjects();
    const sort = 'sort' in overrides ? overrides.sort : this.currentSort();
    const direction = 'direction' in overrides ? overrides.direction : this.currentDirection();
    const page = 'page' in overrides ? overrides.page : this.currentPage();
    const view = 'view' in overrides ? overrides.view : this.currentView();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: search || null,
        subject: subject?.length ? subject : null,
        sort: sort !== 'lastName' ? sort : null,
        direction: direction !== 'asc' ? direction : null,
        page: page ? page : null,
        view: view !== 'cards' ? view : null,
      },
      queryParamsHandling: 'replace',
    });
  }
}
