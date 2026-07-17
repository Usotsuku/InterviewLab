import { Routes } from '@angular/router';

export const analyticsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/analytics-overview/analytics-overview.page').then(
        (m) => m.AnalyticsOverviewPage,
      ),
  },
];
