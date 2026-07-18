import { Injectable, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AsyncStore } from '../../core/store/async.store';
import { InterviewApiService } from '../../core/interview/interview-api.service';
import { Interview } from '../../core/models/domain.models';

export interface DashboardState {
  [key: string]: unknown;
  interviews: Interview[];
}

@Injectable({ providedIn: 'root' })
export class DashboardStore extends AsyncStore<DashboardState> {
  private readonly _api = inject(InterviewApiService);

  readonly interviews = computed(() => this._state().interviews);
  readonly loading = computed(() => this.isLoading('load'));
  readonly error = computed(() => this.getError('load'));

  readonly totalInterviews = computed(() => this.interviews().length);

  readonly completedInterviews = computed(() =>
    this.interviews().filter((i) => i.status === 'COMPLETED'),
  );

  readonly completedCount = computed(() => this.completedInterviews().length);

  readonly averageScore = computed(() => {
    const scored = this.completedInterviews().filter((i) => i.overallScore != null);
    if (scored.length === 0) return null;
    const sum = scored.reduce((acc, i) => acc + (i.overallScore ?? 0), 0);
    return Math.round((sum / scored.length) * 10) / 10;
  });

  readonly averageConfidence = computed(() => {
    const scored = this.completedInterviews().filter((i) => i.confidenceScore != null);
    if (scored.length === 0) return null;
    const sum = scored.reduce((acc, i) => acc + (i.confidenceScore ?? 0), 0);
    return Math.round((sum / scored.length) * 10) / 10;
  });

  readonly averageCommunication = computed(() => {
    const scored = this.completedInterviews().filter((i) => i.communicationScore != null);
    if (scored.length === 0) return null;
    const sum = scored.reduce((acc, i) => acc + (i.communicationScore ?? 0), 0);
    return Math.round((sum / scored.length) * 10) / 10;
  });

  readonly averageTechnical = computed(() => {
    const scored = this.completedInterviews().filter((i) => i.technicalScore != null);
    if (scored.length === 0) return null;
    const sum = scored.reduce((acc, i) => acc + (i.technicalScore ?? 0), 0);
    return Math.round((sum / scored.length) * 10) / 10;
  });

  readonly lastInterview = computed(() => {
    const list = this.interviews();
    if (list.length === 0) return null;
    return list[0];
  });

  readonly recentInterviews = computed(() => this.interviews().slice(0, 5));

  readonly strongestSkill = computed(() => {
    const scored = this.completedInterviews();
    if (scored.length === 0) return null;
    const avgComm = this._avg(scored, 'communicationScore');
    const avgTech = this._avg(scored, 'technicalScore');
    const avgConf = this._avg(scored, 'confidenceScore');
    const best = Math.max(avgComm, avgTech, avgConf);
    if (best === 0) return null;
    if (best === avgTech) return 'Technical';
    if (best === avgComm) return 'Communication';
    return 'Confidence';
  });

  readonly weakestSkill = computed(() => {
    const scored = this.completedInterviews();
    if (scored.length === 0) return null;
    const avgComm = this._avg(scored, 'communicationScore');
    const avgTech = this._avg(scored, 'technicalScore');
    const avgConf = this._avg(scored, 'confidenceScore');
    const vals = [avgComm, avgTech, avgConf].filter((v) => v > 0);
    if (vals.length === 0) return null;
    const worst = Math.min(...vals);
    if (worst === avgTech) return 'Technical';
    if (worst === avgComm) return 'Communication';
    return 'Confidence';
  });

  readonly interviewsThisWeek = computed(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return this.interviews().filter((i) => new Date(i.createdAt) >= weekAgo).length;
  });

  readonly interviewsThisMonth = computed(() => {
    const now = new Date();
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    return this.interviews().filter((i) => new Date(i.createdAt) >= monthAgo).length;
  });

  readonly completionRate = computed(() => {
    const total = this.totalInterviews();
    if (total === 0) return 0;
    return Math.round((this.completedCount() / total) * 100);
  });

  constructor() {
    super({ interviews: [] });
  }

  async loadDashboard(): Promise<void> {
    this._startOperation('load');
    try {
      const res = await firstValueFrom(this._api.getInterviews());
      this._setState({ interviews: res.data });
      this._completeOperation('load');
    } catch (err: unknown) {
      this._failOperation('load', this._extractError(err));
    }
  }

  async deleteInterview(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this._api.deleteInterview(id));
      this._setState({
        interviews: this.interviews().filter((i) => i.id !== id),
      });
      return true;
    } catch {
      return false;
    }
  }

  private _avg(items: Interview[], key: 'communicationScore' | 'technicalScore' | 'confidenceScore'): number {
    const scored = items.filter((i) => i[key] != null);
    if (scored.length === 0) return 0;
    return scored.reduce((acc, i) => acc + (i[key] ?? 0), 0) / scored.length;
  }

  private _extractError(err: unknown): string {
    if (typeof err === 'object' && err !== null && 'error' in err) {
      const httpErr = err as { error: { message?: string } };
      return httpErr.error?.message ?? 'Failed to load dashboard';
    }
    return 'Failed to load dashboard';
  }
}
