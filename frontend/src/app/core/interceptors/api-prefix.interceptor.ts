import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * Prepends the API base URL to every outgoing request.
 * Skips requests that are already absolute URLs (e.g. CDN, Google Fonts).
 */
export const apiPrefixInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  if (req.url.startsWith('http') || req.url.startsWith('//')) {
    return next(req);
  }

  const apiReq = req.clone({
    url: `${environment.apiUrl}${req.url}`,
  });

  return next(apiReq);
};
