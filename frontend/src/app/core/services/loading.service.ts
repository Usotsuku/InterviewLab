import { Injectable, signal } from '@angular/core';

/**
 * LoadingService — tracks global loading state.
 * Used by loadingInterceptor for top-level loading indicators.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly _active = signal(false);

  readonly active = this._active.asReadonly();

  start(): void {
    this._active.set(true);
  }

  stop(): void {
    this._active.set(false);
  }
}
