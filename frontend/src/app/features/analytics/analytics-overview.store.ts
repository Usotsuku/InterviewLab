import { Injectable, computed } from '@angular/core';
import { BaseStore } from '../../core/store/base.store';

export interface ChartConfig {
  title: string;
  placeholder: boolean;
}

export interface AnalyticsOverviewState {
  charts: ChartConfig[];
  loading: boolean;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsOverviewStore extends BaseStore<AnalyticsOverviewState> {
  readonly charts = computed(() => this._state().charts);

  constructor() {
    super({
      charts: [
        { title: 'Score Over Time', placeholder: true },
        { title: 'Communication Metrics', placeholder: true },
        { title: 'Words Per Minute', placeholder: true },
        { title: 'Filler Word Frequency', placeholder: true },
      ],
      loading: false,
      error: null,
    });
  }
}
