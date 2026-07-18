import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, retry, timer, throwError } from 'rxjs';

const RETRY_COUNT = 2;
const RETRY_DELAY_MS = 1000;

/**
 * retryInterceptor — retries transient HTTP errors (408, 429, 502, 503, 504)
 * with delay. Only retries GET requests.
 */
export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') {
    return next(req);
  }

  return next(req).pipe(
    retry({
      count: RETRY_COUNT,
      delay: (error, retryCount) => {
        const isRetryable = [408, 429, 502, 503, 504].includes(error.status);
        if (!isRetryable) {
          return throwError(() => error);
        }
        return timer(RETRY_DELAY_MS * retryCount);
      },
    }),
  );
};
