import { computed } from '@angular/core';
import { BaseStore, BaseState } from './base.store';

export interface ListState<T> extends BaseState {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * ListStore<T> — extends BaseStore for paginated list management.
 * Manages items, pagination state, and selection.
 */
export abstract class ListStore<T> extends BaseStore<ListState<T>> {
  readonly items = computed(() => this._state().items);
  readonly total = computed(() => this._state().total);
  readonly page = computed(() => this._state().page);
  readonly limit = computed(() => this._state().limit);
  readonly totalPages = computed(() =>
    Math.ceil(this._state().total / this._state().limit),
  );
  readonly isEmpty = computed(() => this._state().items.length === 0 && !this._state().loading);

  constructor(initialLimit = 20) {
    super({
      items: [],
      total: 0,
      page: 1,
      limit: initialLimit,
      loading: false,
      error: null,
    });
  }

  protected _setItems(items: T[], total: number): void {
    this._setState({ items, total } as Partial<ListState<T>>);
  }

  protected _appendItems(newItems: T[]): void {
    this._state.update((s) => ({
      ...s,
      items: [...s.items, ...newItems],
    }));
  }

  nextPage(): void {
    this._setState({ page: this._state().page + 1 } as Partial<ListState<T>>);
  }

  resetList(): void {
    this._setState({ items: [], total: 0, page: 1 } as Partial<ListState<T>>);
  }
}
