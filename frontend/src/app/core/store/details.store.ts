import { computed, Signal } from '@angular/core';
import { BaseStore, BaseState } from './base.store';

export interface DetailsState<T> extends BaseState {
  details: T | null;
  lastLoadedId: string | null;
}

/**
 * DetailsStore<T> — extends BaseStore for detail/single-view state.
 * Tracks which entity ID was last loaded to avoid redundant fetches.
 */
export abstract class DetailsStore<T> extends BaseStore<DetailsState<T>> {
  readonly details = computed(() => this._state().details);
  readonly lastLoadedId = computed(() => this._state().lastLoadedId);
  readonly hasDetails = computed(() => this._state().details !== null);

  constructor() {
    super({
      details: null,
      lastLoadedId: null,
      loading: false,
      error: null,
    });
  }

  protected _setDetails(details: T, id: string): void {
    this._setState({ details, lastLoadedId: id, loading: false } as Partial<DetailsState<T>>);
  }

  protected _clearDetails(): void {
    this._setState({ details: null, lastLoadedId: null } as Partial<DetailsState<T>>);
  }

  hasLoaded(id: string): boolean {
    return this._state().lastLoadedId === id && !this._state().loading;
  }
}
