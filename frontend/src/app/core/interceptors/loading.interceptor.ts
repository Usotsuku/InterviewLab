import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

let activeRequests = 0;

/**
 * loadingInterceptor — tracks in-flight HTTP requests for global loading state.
 * Only tracks requests that opt in via `reportProgress: true` is NOT used;
 * instead uses the request header `X-Track-Loading`.
 */
export const loadingInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  if (!req.headers.has('X-Track-Loading')) {
    return next(req);
  }

  const loadingService = inject(LoadingService);
  activeRequests++;

  if (activeRequests === 1) {
    loadingService.start();
  }

  return next(req).pipe(
    finalize(() => {
      activeRequests--;
      if (activeRequests === 0) {
        loadingService.stop();
      }
    }),
  );
};
