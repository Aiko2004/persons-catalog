import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from '../models/api.model';
import {
  BulkCreateResponse,
  PersonDetailResponse,
  PersonRequest,
  PersonResponse,
  PersonsParams,
} from '../models/person.model';

@Injectable({ providedIn: 'root' })
export class PersonService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/persons';

  getPersons(params: PersonsParams = {}): Observable<PageResponse<PersonResponse>> {
    let httpParams = new HttpParams();

    if (params.search) httpParams = httpParams.set('search', params.search);

    if (params.subject) {
      const subjects = Array.isArray(params.subject) ? params.subject : [params.subject];
      for (const s of subjects) httpParams = httpParams.append('subject', s);
    }

    if (params.verified !== undefined)
      httpParams = httpParams.set('verified', String(params.verified));
    if (params.page !== undefined) httpParams = httpParams.set('page', String(params.page));
    if (params.size !== undefined) httpParams = httpParams.set('size', String(params.size));
    if (params.sort) httpParams = httpParams.set('sort', params.sort);
    if (params.direction) httpParams = httpParams.set('direction', params.direction);

    return this.http.get<PageResponse<PersonResponse>>(this.base, { params: httpParams });
  }

  getPerson(id: string): Observable<PersonDetailResponse> {
    return this.http.get<PersonDetailResponse>(`${this.base}/${id}`);
  }

  createPerson(req: PersonRequest): Observable<PersonDetailResponse> {
    return this.http.post<PersonDetailResponse>(this.base, req);
  }

  updatePerson(id: string, req: PersonRequest): Observable<PersonDetailResponse> {
    return this.http.put<PersonDetailResponse>(`${this.base}/${id}`, req);
  }

  deletePerson(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  bulkCreatePersons(reqs: PersonRequest[]): Observable<BulkCreateResponse> {
    return this.http.post<BulkCreateResponse>(`${this.base}/bulk`, reqs);
  }

  uploadPhoto(id: string, file: File): Observable<PersonDetailResponse> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<PersonDetailResponse>(`${this.base}/${id}/photo`, form);
  }

  deletePhoto(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}/photo`);
  }
}
