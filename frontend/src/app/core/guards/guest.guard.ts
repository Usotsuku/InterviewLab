import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../auth/auth.store';

/**
 * guestGuard — prevents authenticated users from accessing login/register pages.
 * Redirects to /dashboard if a valid session exists.
 */
export const guestGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.isAuthenticated()) return true;
  return router.parseUrl('/dashboard');
};
