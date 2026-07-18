import { Routes } from '@angular/router';

export const profileRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/profile-view').then((m) => m.ProfileViewPage),
  },
  {
    path: 'edit',
    loadComponent: () =>
      import('./pages/profile-edit').then((m) => m.ProfileEditPage),
  },
];
