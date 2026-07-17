import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../notification/notification.service';

/**
 * Global HTTP error interceptor.
 * - 401: clear tokens and redirect to /auth/login
 * - 403: redirect to /auth/login
 * - 5xx: display generic system error notification
 */
export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const router = inject(Router);
  const notifications = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        localStorage.removeItem('il_access_token');
        localStorage.removeItem('il_refresh_token');
        router.navigate(['/auth/login']);
      } else if (error.status === 403) {
        router.navigate(['/auth/login']);
      } else if (error.status >= 500) {
        notifications.showError('A server error occurred. Please try again.');
      }
      return throwError(() => error);
    }),
  );
};
