import { Routes } from '@angular/router';

export const historyRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/history-list/history-list.page').then((m) => m.HistoryListPage),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/history-detail/history-detail.page').then((m) => m.HistoryDetailPage),
  },
];
