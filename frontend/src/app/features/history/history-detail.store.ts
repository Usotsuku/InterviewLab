import { Injectable, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DetailsStore } from '../../core/store/details.store';
import { InterviewApiService } from '../../core/interview/interview-api.service';
import { InterviewReport } from '../../core/models/domain.models';

@Injectable({ providedIn: 'root' })
export class HistoryDetailStore extends DetailsStore<InterviewReport> {
  private readonly _api = inject(InterviewApiService);

  readonly report = computed(() => this.details());
  readonly interviewSummary = computed(() => this.details()?.interview ?? null);
  readonly questions = computed(() => this.details()?.questions ?? []);
  readonly totalAnswered = computed(() => this.details()?.totalAnswered ?? 0);
  readonly totalQuestions = computed(() => this.details()?.totalQuestions ?? 0);
  readonly durationMinutes = computed(() => this.details()?.durationMinutes ?? 0);

  async loadReport(id: string): Promise<void> {
    if (this.hasLoaded(id)) return;
    this._setLoading(true);
    this._setError(null);
    try {
      const res = await firstValueFrom(this._api.getReport(id));
      this._setDetails(res.data, id);
    } catch (err: unknown) {
      this._setError(this._extractError(err));
      this._setLoading(false);
    }
  }

  async reloadReport(id: string): Promise<void> {
    this._clearDetails();
    await this.loadReport(id);
  }

  private _extractError(err: unknown): string {
    if (typeof err === 'object' && err !== null && 'error' in err) {
      const httpErr = err as { error: { message?: string } };
      return httpErr.error?.message ?? 'Failed to load interview report';
    }
    return 'Failed to load interview report';
  }
}
