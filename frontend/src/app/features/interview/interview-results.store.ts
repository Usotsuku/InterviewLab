import { Injectable, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DetailsStore } from '../../core/store/details.store';
import { InterviewApiService } from '../../core/interview/interview-api.service';
import { Interview, Question } from '../../core/models/domain.models';

export interface InterviewResultsData {
  interview: Interview;
  questions: Question[];
}

export interface InterviewResultsState {
  details: InterviewResultsData | null;
  lastLoadedId: string | null;
  loading: boolean;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class InterviewResultsStore extends DetailsStore<InterviewResultsData> {
  private readonly _api = inject(InterviewApiService);

  readonly interview = computed(() => this.details()?.interview ?? null);
  readonly questions = computed(() => this.details()?.questions ?? []);

  readonly title = computed(() => this.interview()?.title ?? 'Interview Session');
  readonly mode = computed(() => this.interview()?.mode ?? '');
  readonly completedAt = computed(() => this.interview()?.completedAt ?? null);
  readonly startedAt = computed(() => this.interview()?.startedAt ?? null);
  readonly isCompleted = computed(() => this.interview()?.status === 'COMPLETED');

  readonly overallScore = computed(() => this.interview()?.overallScore ?? null);
  readonly communicationScore = computed(() => this.interview()?.communicationScore ?? null);
  readonly technicalScore = computed(() => this.interview()?.technicalScore ?? null);
  readonly confidenceScore = computed(() => this.interview()?.confidenceScore ?? null);

  readonly totalQuestions = computed(() => this.interview()?.totalQuestions ?? 0);
  readonly answeredQuestions = computed(() => this.interview()?.currentQuestionIndex ?? 0);

  readonly completionPercent = computed(() => {
    const total = this.totalQuestions();
    if (total === 0) return 0;
    return Math.round((this.answeredQuestions() / total) * 100);
  });

  readonly overallGrade = computed(() => {
    const score = this.overallScore();
    if (score === null) return null;
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  });

  readonly overallSummary = computed(() => {
    const score = this.overallScore();
    if (score === null) return null;
    if (score >= 90) return 'Excellent performance. You demonstrated strong mastery across all areas.';
    if (score >= 80) return 'Good performance. Solid answers with room for minor improvements.';
    if (score >= 70) return 'Decent performance. Some areas need improvement.';
    if (score >= 60) return 'Below average. Focus on strengthening core concepts.';
    return 'Needs improvement. Consider revisiting fundamentals.';
  });

  readonly strongestCategory = computed(() => {
    const scores = [
      { label: 'Communication', value: this.communicationScore() },
      { label: 'Technical', value: this.technicalScore() },
      { label: 'Confidence', value: this.confidenceScore() },
    ].filter((s) => s.value !== null) as { label: string; value: number }[];

    if (scores.length === 0) return null;
    return scores.reduce((best, curr) => (curr.value > best.value ? curr : best)).label;
  });

  readonly weakestCategory = computed(() => {
    const scores = [
      { label: 'Communication', value: this.communicationScore() },
      { label: 'Technical', value: this.technicalScore() },
      { label: 'Confidence', value: this.confidenceScore() },
    ].filter((s) => s.value !== null) as { label: string; value: number }[];

    if (scores.length === 0) return null;
    return scores.reduce((worst, curr) => (curr.value < worst.value ? curr : worst)).label;
  });

  readonly interviewDurationMinutes = computed(() => {
    const start = this.startedAt();
    const end = this.completedAt();
    if (!start || !end) return null;
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(1, Math.round(diffMs / 60000));
  });

  readonly questionsByType = computed(() => {
    const qs = this.questions();
    return {
      technical: qs.filter((q) => q.type === 'TECHNICAL').length,
      hr: qs.filter((q) => q.type === 'HR').length,
      communication: qs.filter((q) => q.type === 'COMMUNICATION').length,
    };
  });

  readonly sortedQuestions = computed(() =>
    [...this.questions()].sort((a, b) => a.order - b.order)
  );

  async loadResults(id: string): Promise<void> {
    if (this.hasLoaded(id)) return;

    this._setLoading(true);
    this._setError(null);

    try {
      const [interviewRes, questionsRes] = await Promise.all([
        firstValueFrom(this._api.getInterview(id)),
        firstValueFrom(this._api.getQuestions(id)),
      ]);

      this._setDetails(
        { interview: interviewRes.data, questions: questionsRes.data },
        id,
      );
    } catch (err: unknown) {
      const message = this._extractError(err);
      this._setError(message);
      this._setLoading(false);
    }
  }

  async reload(id: string): Promise<void> {
    this._clearDetails();
    await this.loadResults(id);
  }

  private _extractError(err: unknown): string {
    if (typeof err === 'object' && err !== null && 'error' in err) {
      const httpErr = err as { error: { message?: string } };
      return httpErr.error?.message ?? 'Failed to load results';
    }
    return 'Failed to load results';
  }
}
