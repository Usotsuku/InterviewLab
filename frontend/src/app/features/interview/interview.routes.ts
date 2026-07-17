import { Routes } from '@angular/router';

export const interviewRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/interview-setup/interview-setup.page').then((m) => m.InterviewSetupPage),
  },
  {
    path: ':id/session',
    loadComponent: () =>
      import('./pages/interview-session/interview-session.page').then((m) => m.InterviewSessionPage),
  },
  {
    path: ':id/results',
    loadComponent: () =>
      import('./pages/interview-results/interview-results.page').then((m) => m.InterviewResultsPage),
  },
];
