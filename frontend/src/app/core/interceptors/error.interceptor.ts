import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { TokenService } from '../auth/token.service';
import { NotificationService } from '../notification/notification.service';

/**
 * errorInterceptor — global HTTP error handler.
 * - 401: clear tokens, redirect to login (if not already on login page)
 * - 403: redirect to login
 * - 422: pass through for form-level handling
 * - 5xx: display generic server error notification
 */
export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const router = inject(Router);
  const tokenService = inject(TokenService);
  const notifications = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        tokenService.clearTokens();
        const isOnAuthPage = req.url.includes('/auth/login') || req.url.includes('/auth/register');
        if (!isOnAuthPage) {
          router.navigate(['/auth/login']);
        }
      } else if (error.status === 403) {
        tokenService.clearTokens();
        router.navigate(['/auth/login']);
      } else if (error.status >= 500) {
        const message = error.error?.message ?? 'A server error occurred. Please try again.';
        notifications.showError(message);
      }
      return throwError(() => error);
    }),
  );
};
