import { Injectable, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DetailsStore } from '../../core/store/details.store';
import { InterviewApiService } from '../../core/interview/interview-api.service';
import { InterviewReport } from '../../core/models/domain.models';
import { extractErrorMessage } from '../../core/http/error-message';

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
      this._setError(extractErrorMessage(err, 'Failed to load interview report'));
      this._setLoading(false);
    }
  }

  async reloadReport(id: string): Promise<void> {
    this._clearDetails();
    await this.loadReport(id);
  }

}
