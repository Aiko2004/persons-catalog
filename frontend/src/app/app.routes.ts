import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/catalog/catalog.component').then((m) => m.CatalogComponent),
  },
  {
    // persons/new — перед :id, иначе строка 'new' будет поглощена как id
    path: 'persons/new',
    loadComponent: () =>
      import('./features/person-form/person-form.component').then((m) => m.PersonFormComponent),
  },
  {
    path: 'persons/:id',
    loadComponent: () =>
      import('./features/person-detail/person-detail.component').then(
        (m) => m.PersonDetailComponent,
      ),
  },
  {
    path: 'persons/:id/edit',
    loadComponent: () =>
      import('./features/person-form/person-form.component').then((m) => m.PersonFormComponent),
  },
  {
    path: 'subjects',
    loadComponent: () =>
      import('./features/subjects/subjects.component').then((m) => m.SubjectsComponent),
  },
];
