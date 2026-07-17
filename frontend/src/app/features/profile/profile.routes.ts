import { Routes } from '@angular/router';

export const profileRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/profile-view/profile-view.page').then((m) => m.ProfileViewPage),
  },
  {
    path: 'edit',
    loadComponent: () =>
      import('./pages/profile-edit/profile-edit.page').then((m) => m.ProfileEditPage),
  },
];
