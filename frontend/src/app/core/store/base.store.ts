import { signal, computed, Signal } from '@angular/core';

export interface BaseState {
  loading: boolean;
  error: string | null;
}

/**
 * BaseStore<TState> — generic signal-based unidirectional state container.
 *
 * Rules:
 * - State is read-only from outside the store (via computed signals).
 * - Only the store mutates its own state via _setState().
 * - Components never receive store references — they receive signal values.
 */
export abstract class BaseStore<TState extends BaseState> {
  protected readonly _state: ReturnType<typeof signal<TState>>;

  readonly loading: Signal<boolean>;
  readonly error: Signal<string | null>;

  constructor(initialState: TState) {
    this._state = signal<TState>(initialState);
    this.loading = computed(() => this._state().loading);
    this.error = computed(() => this._state().error);
  }

  protected _setState(partial: Partial<TState>): void {
    this._state.update((s) => ({ ...s, ...partial }));
  }

  protected _setLoading(loading: boolean): void {
    this._setState({ loading } as Partial<TState>);
  }

  protected _setError(error: string | null): void {
    this._setState({ error } as Partial<TState>);
  }

  resetError(): void {
    this._setError(null);
  }
}
