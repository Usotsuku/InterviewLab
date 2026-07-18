import { computed, signal, Signal } from '@angular/core';
import { BaseStore, BaseState } from './base.store';

export interface EntityState<T> extends BaseState {
  entity: T | null;
  initialized: boolean;
}

/**
 * EntityStore<T> — extends BaseStore for single-entity state management.
 * Manages loading, error, and a single entity.
 */
export abstract class EntityStore<T> extends BaseStore<EntityState<T>> {
  readonly entity = computed(() => this._state().entity);
  readonly initialized = computed(() => this._state().initialized);
  readonly hasEntity = computed(() => this._state().entity !== null);

  constructor() {
    super({
      entity: null,
      initialized: false,
      loading: false,
      error: null,
    });
  }

  protected _setEntity(entity: T | null): void {
    this._setState({ entity, initialized: true, loading: false } as Partial<EntityState<T>>);
  }

  protected _clearEntity(): void {
    this._setState({ entity: null, initialized: false } as Partial<EntityState<T>>);
  }
}
