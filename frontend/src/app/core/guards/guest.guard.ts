import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../auth/auth.store';

/**
 * guestGuard — prevents authenticated users from accessing login/register pages.
 * Redirects to /dashboard if a valid session exists.
 */
export const guestGuard: CanActivateFn = async () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  await authStore.waitForInitialization();
  if (!authStore.isAuthenticated()) return true;
  return router.parseUrl('/dashboard');
};
