export interface SubjectRef {
  id: string;
  name: string;
  slug: string;
}

export interface SubjectResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  personCount: number;
}

export interface SubjectRequest {
  name: string;
  slug?: string;
  description?: string;
}
