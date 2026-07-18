import { Injectable, computed } from '@angular/core';
import { BaseStore } from '../../core/store/base.store';

export interface DashboardStat {
  label: string;
  value: string;
}

export interface DashboardState {
  stats: DashboardStat[];
  loading: boolean;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class DashboardStore extends BaseStore<DashboardState> {
  readonly stats = computed(() => this._state().stats);

  constructor() {
    super({
      stats: [
        { label: 'Overall Score', value: '—' },
        { label: 'Communication', value: '—' },
        { label: 'Technical', value: '—' },
        { label: 'Sessions', value: '0' },
      ],
      loading: false,
      error: null,
    });
  }
}
