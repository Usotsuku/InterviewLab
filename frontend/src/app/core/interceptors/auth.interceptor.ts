import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse, HttpBackend } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, Subject, filter, take } from 'rxjs';
import { TokenService } from '../auth/token.service';
import { AuthStore } from '../auth/auth.store';
import { ApiResponse } from '../http/api-response.interface';
import { environment } from '../../../environments/environment';

let isRefreshing = false;
const refreshCompleted$ = new Subject<boolean>();

/**
 * Attaches Bearer JWT to every request.
 * On 401: attempts one silent token refresh via /auth/refresh (bypassing interceptors),
 * then retries the original request once. If refresh fails, clears session and redirects.
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  const backend = inject(HttpBackend);
  const authStore = inject(AuthStore);

  const token = tokenService.getAccessToken();
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthEndpoint = req.url.includes('/auth/login') ||
        req.url.includes('/auth/register') ||
        req.url.includes('/auth/refresh') ||
        req.url.includes('/auth/forgot-password') ||
        req.url.includes('/auth/reset-password');

      if (error.status !== 401 || isAuthEndpoint) {
        return throwError(() => error);
      }

      if (isRefreshing) {
        return refreshCompleted$.pipe(
          filter((success) => success),
          take(1),
          switchMap(() => {
            const newToken = tokenService.getAccessToken();
            if (!newToken) {
              return throwError(() => error);
            }
            const retryReq = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
            return next(retryReq);
          }),
        );
      }

      isRefreshing = true;
      const refreshToken = tokenService.getRefreshToken();

      if (!refreshToken) {
        _failAuth(tokenService, authStore, router, false);
        return throwError(() => error);
      }

      const refreshReq = new HttpRequest('POST', `${environment.apiUrl}/auth/refresh`, {
        refreshToken,
      });
      return backend.handle(refreshReq).pipe(
        switchMap((event) => {
          const body = (event as { body?: ApiResponse<{ accessToken: string; refreshToken: string }> }).body;
          if (!body?.data) {
            _failAuth(tokenService, authStore, router, false);
            return throwError(() => error);
          }
          tokenService.setTokens(body.data.accessToken, body.data.refreshToken);
          refreshCompleted$.next(true);
          const retryReq = req.clone({ setHeaders: { Authorization: `Bearer ${body.data.accessToken}` } });
          return next(retryReq);
        }),
        catchError((refreshError) => {
          _failAuth(tokenService, authStore, router, true);
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};

function _failAuth(tokenService: TokenService, authStore: AuthStore, router: Router, refreshFailed: boolean): void {
  tokenService.clearTokens();
  authStore['_setState']({ user: null, isAuthenticated: false, error: null });
  if (refreshFailed) {
    refreshCompleted$.next(false);
  }
  isRefreshing = false;
  router.navigate(['/auth/login']);
}
