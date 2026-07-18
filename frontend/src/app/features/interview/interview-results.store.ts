import { Injectable, computed } from '@angular/core';
import { BaseStore } from '../../core/store/base.store';
import { Interview } from '../../core/models/domain.models';

export interface InterviewResultsState {
  interview: Interview | null;
  activeTab: number;
  loading: boolean;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class InterviewResultsStore extends BaseStore<InterviewResultsState> {
  readonly interview = computed(() => this._state().interview);
  readonly activeTab = computed(() => this._state().activeTab);
  readonly overallScore = computed(() => this._state().interview?.overallScore ?? null);
  readonly communicationScore = computed(() => this._state().interview?.communicationScore ?? null);
  readonly technicalScore = computed(() => this._state().interview?.technicalScore ?? null);
  readonly confidenceScore = computed(() => this._state().interview?.confidenceScore ?? null);

  constructor() {
    super({
      interview: null,
      activeTab: 0,
      loading: false,
      error: null,
    });
  }

  setInterview(interview: Interview): void {
    this._setState({ interview });
  }

  setActiveTab(index: number): void {
    this._setState({ activeTab: index });
  }
}
