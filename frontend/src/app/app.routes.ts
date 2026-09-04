import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/catalog/catalog.component').then((m) => m.CatalogComponent),
  },
  {
    path: 'persons/:id',
    loadComponent: () =>
      import('./features/person-detail/person-detail.component').then(
        (m) => m.PersonDetailComponent,
      ),
  },
];
