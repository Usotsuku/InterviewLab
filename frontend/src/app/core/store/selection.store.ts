import { computed, signal, Signal, WritableSignal } from '@angular/core';

export interface SelectionState<T> {
  selected: Map<string, T>;
  mode: 'single' | 'multiple';
}

/**
 * SelectionStore<T> — manages selection state for lists/grids.
 * Supports both single and multiple selection modes.
 * Entities must have an `id` string field.
 */
export class SelectionStore<T extends { id: string }> {
  protected readonly _state: WritableSignal<SelectionState<T>>;

  readonly selected = computed(() => Array.from(this._state().selected.values()));
  readonly selectedIds = computed(() => Array.from(this._state().selected.keys()));
  readonly selectedCount = computed(() => this._state().selected.size);
  readonly mode = computed(() => this._state().mode);
  readonly isEmpty = computed(() => this._state().selected.size === 0);

  constructor(mode: 'single' | 'multiple' = 'multiple') {
    this._state = signal<SelectionState<T>>({
      selected: new Map<string, T>(),
      mode,
    });
  }

  isSelected(id: string): boolean {
    return this._state().selected.has(id);
  }

  getSelected(): T | undefined {
    const entries = Array.from(this._state().selected.values());
    return entries[0];
  }

  toggle(item: T): void {
    if (this._state().mode === 'single') {
      this._toggleSingle(item);
    } else {
      this._toggleMultiple(item);
    }
  }

  select(item: T): void {
    this._state.update((s) => {
      const next = new Map(s.selected);
      next.set(item.id, item);
      return { ...s, selected: next };
    });
  }

  deselect(id: string): void {
    this._state.update((s) => {
      const next = new Map(s.selected);
      next.delete(id);
      return { ...s, selected: next };
    });
  }

  selectAll(items: T[]): void {
    if (this._state().mode === 'single') return;
    this._state.update((s) => {
      const next = new Map(s.selected);
      items.forEach((item) => next.set(item.id, item));
      return { ...s, selected: next };
    });
  }

  deselectAll(): void {
    this._state.update((s) => ({ ...s, selected: new Map() }));
  }

  setMode(mode: 'single' | 'multiple'): void {
    if (mode === 'single') {
      const entries = Array.from(this._state().selected.values());
      const first = entries[0];
      this._state.update((s) => ({
        ...s,
        mode,
        selected: first ? new Map([[first.id, first]]) : new Map(),
      }));
    } else {
      this._state.update((s) => ({ ...s, mode }));
    }
  }

  private _toggleSingle(item: T): void {
    this._state.update((s) => {
      const next = new Map<string, T>();
      if (!s.selected.has(item.id)) {
        next.set(item.id, item);
      }
      return { ...s, selected: next };
    });
  }

  private _toggleMultiple(item: T): void {
    this._state.update((s) => {
      const next = new Map(s.selected);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.set(item.id, item);
      }
      return { ...s, selected: next };
    });
  }
}
