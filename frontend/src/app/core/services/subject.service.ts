import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay, tap } from 'rxjs/operators';
import { SubjectRequest, SubjectResponse } from '../models/subject.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SubjectService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/subjects`;

  /** Закэшированный список предметов для дропдаунов по всему приложению */
  readonly subjects = signal<SubjectResponse[]>([]);

  private cache$: Observable<SubjectResponse[]> | null = null;

  /** Несколько компонентов могут вызвать этот метод — HTTP-запрос уйдёт только один раз */
  loadSubjects(): Observable<SubjectResponse[]> {
    if (!this.cache$) {
      this.cache$ = this.http.get<SubjectResponse[]>(this.base).pipe(
        tap((list) => this.subjects.set(list)),
        catchError((err) => {
          this.cache$ = null; // позволяет повторить запрос после ошибки
          return throwError(() => err);
        }),
        shareReplay(1),
      );
    }
    return this.cache$;
  }

  createSubject(req: SubjectRequest): Observable<SubjectResponse> {
    return this.http.post<SubjectResponse>(this.base, req).pipe(
      tap(() => (this.cache$ = null)),
    );
  }

  updateSubject(id: string, req: SubjectRequest): Observable<SubjectResponse> {
    return this.http.put<SubjectResponse>(`${this.base}/${id}`, req).pipe(
      tap(() => (this.cache$ = null)),
    );
  }

  /** force=true — жіберіледі, кейін пайдаланушы растағаннан */
  deleteSubject(id: string, force = false): Observable<void> {
    const options = force ? { params: { force: 'true' } } : {};
    return this.http.delete<void>(`${this.base}/${id}`, options).pipe(
      tap(() => (this.cache$ = null)),
    );
  }
}
