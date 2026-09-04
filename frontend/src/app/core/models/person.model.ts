import { SubjectRef } from './subject.model';

export type PersonSortField =
  | 'lastName'
  | 'firstName'
  | 'birthYear'
  | 'deathYear'
  | 'workStartYear'
  | 'workEndYear'
  | 'createdAt';

export type SortDirection = 'asc' | 'desc';

export interface PersonsParams {
  search?: string;
  subject?: string | string[];
  verified?: boolean;
  page?: number;
  size?: number;
  sort?: PersonSortField;
  direction?: SortDirection;
}

export interface PersonResponse {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  fullName: string;
  birthYear: number | null;
  deathYear: number | null;
  workStartYear: number | null;
  workEndYear: number | null;
  photoUrl: string | null;
  verified: boolean;
  subjects: SubjectRef[];
}

export interface PersonDetailResponse extends PersonResponse {
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PersonRequest {
  firstName: string;
  lastName: string;
  middleName?: string;
  birthYear?: number;
  deathYear?: number;
  workStartYear?: number;
  workEndYear?: number;
  description?: string;
  verified?: boolean;
  subjectIds?: string[];
}

export interface BulkCreateResponse {
  created: number;
  ids: string[];
}
