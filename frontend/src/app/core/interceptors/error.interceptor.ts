import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../notification/notification.service';

/**
 * errorInterceptor — global HTTP error handler.
 * - 401: handled by authInterceptor (token refresh)
 * - 403: redirect to login
 * - 422: pass through for form-level handling
 * - 5xx: display generic server error notification
 *
 * NOTE: 401 is NOT handled here. It is handled in authInterceptor
 * which runs earlier in the chain and manages automatic token refresh.
 */
export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const router = inject(Router);
  const notifications = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 403) {
        router.navigate(['/auth/login']);
      } else if (error.status >= 500) {
        const message = error.error?.message ?? 'A server error occurred. Please try again.';
        notifications.showError(message);
      }
      return throwError(() => error);
    }),
  );
};
