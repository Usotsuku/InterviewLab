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

  const base = environment.apiUrl.replace(/\/+$/, '');
  const path = req.url.replace(/^\/+/, '');
  const apiReq = req.clone({
    url: `${base}/${path}`,
  });

  return next(apiReq);
};
