import { Routes } from '@angular/router';

export const settingsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/settings-home/settings-home.page').then((m) => m.SettingsHomePage),
  },
];
