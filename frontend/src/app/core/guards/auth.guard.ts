import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../auth/auth.store';

/**
 * authGuard — blocks unauthenticated users from protected routes.
 * Redirects to /auth/login if no valid session exists.
 */
export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isAuthenticated()) return true;
  return router.parseUrl('/auth/login');
};
