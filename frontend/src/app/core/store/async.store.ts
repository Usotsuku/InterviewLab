import { computed, signal, Signal, WritableSignal } from '@angular/core';

export interface AsyncOperation {
  key: string;
  loading: boolean;
  error: string | null;
}

export interface AsyncState {
  operations: Record<string, AsyncOperation>;
}

/**
 * AsyncStore<TState> — extends BaseState pattern with concurrent async operation tracking.
 * Enables multiple independent loading states (e.g., saving profile while loading list).
 */
export abstract class AsyncStore<TState extends Record<string, unknown>> {
  protected readonly _state: WritableSignal<TState & AsyncState>;

  readonly operations = computed(() => this._state().operations);

  constructor(initialState: TState) {
    this._state = signal<TState & AsyncState>({
      ...initialState,
      operations: {},
    } as TState & AsyncState);
  }

  protected _setState(partial: Partial<TState & AsyncState>): void {
    this._state.update((s) => ({ ...s, ...partial }));
  }

  isLoading(key: string): boolean {
    return this._state().operations[key]?.loading ?? false;
  }

  getError(key: string): string | null {
    return this._state().operations[key]?.error ?? null;
  }

  anyLoading(): boolean {
    return Object.values(this._state().operations).some((op) => op.loading);
  }

  protected _startOperation(key: string): void {
    this._state.update((s) => ({
      ...s,
      operations: {
        ...s.operations,
        [key]: { key, loading: true, error: null },
      },
    }));
  }

  protected _completeOperation(key: string): void {
    this._state.update((s) => ({
      ...s,
      operations: {
        ...s.operations,
        [key]: { key, loading: false, error: null },
      },
    }));
  }

  protected _failOperation(key: string, error: string): void {
    this._state.update((s) => ({
      ...s,
      operations: {
        ...s.operations,
        [key]: { key, loading: false, error },
      },
    }));
  }

  protected _clearOperation(key: string): void {
    this._state.update((s) => {
      const { [key]: _, ...rest } = s.operations;
      return { ...s, operations: rest };
    });
  }

  clearAllOperations(): void {
    this._setState({ operations: {} } as Partial<TState & AsyncState>);
  }
}
