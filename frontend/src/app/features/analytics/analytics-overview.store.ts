import { Injectable, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AsyncStore } from '../../core/store/async.store';
import { InterviewApiService } from '../../core/interview/interview-api.service';
import { Interview, InterviewReport } from '../../core/models/domain.models';
import { extractErrorMessage } from '../../core/http/error-message';

export interface TrendPoint {
  value: number;
  index: number;
}

export interface TrendResult {
  current: number;
  previous: number;
  change: number;
  direction: 'up' | 'down' | 'flat';
  hasData: boolean;
}

export interface Insight {
  id: string;
  icon: string;
  message: string;
  positive: boolean;
}

export interface AnalyticsState {
  [key: string]: unknown;
  reports: Map<string, InterviewReport>;
  interviews: Interview[];
}

@Injectable({ providedIn: 'root' })
export class AnalyticsOverviewStore extends AsyncStore<AnalyticsState> {
  private readonly _api = inject(InterviewApiService);

  readonly interviews = computed(() => this._state().interviews);
  readonly reports = computed(() => this._state().reports);
  readonly loading = computed(() => this.isLoading('load'));
  readonly error = computed(() => this.getError('load'));

  readonly completedInterviews = computed(() =>
    this.interviews().filter((i) => i.status === 'COMPLETED'),
  );

  readonly completedCount = computed(() => this.completedInterviews().length);

  readonly sortedSummaries = computed(() => {
    const reports = Array.from(this.reports().values());
    return reports
      .map((r) => r.interview)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  });

  readonly scoreTrend = computed((): TrendPoint[] =>
    this.sortedSummaries()
      .filter((s) => s.overallScore != null)
      .map((s, i) => ({ value: s.overallScore, index: i })),
  );

  readonly confidenceTrend = computed((): TrendPoint[] =>
    this.sortedSummaries()
      .filter((s) => s.confidenceScore != null)
      .map((s, i) => ({ value: s.confidenceScore, index: i })),
  );

  readonly communicationTrend = computed((): TrendPoint[] =>
    this.sortedSummaries()
      .filter((s) => s.communicationScore != null)
      .map((s, i) => ({ value: s.communicationScore, index: i })),
  );

  readonly technicalTrend = computed((): TrendPoint[] =>
    this.sortedSummaries()
      .filter((s) => s.technicalScore != null)
      .map((s, i) => ({ value: s.technicalScore, index: i })),
  );

  readonly averageScore = computed(() => this._avgFromSummaries('overallScore'));
  readonly averageConfidence = computed(() => this._avgFromSummaries('confidenceScore'));
  readonly averageCommunication = computed(() => this._avgFromSummaries('communicationScore'));
  readonly averageTechnical = computed(() => this._avgFromSummaries('technicalScore'));

  readonly averageWordsPerMinute = computed(() => this._avgFromMetric('wordsPerMinute'));
  readonly averageVocabularyRichness = computed(() => this._avgFromMetric('vocabularyRichness'));
  readonly averageKeywordCoverage = computed(() => this._avgFromMetric('keywordCoverage'));
  readonly averageFillerCount = computed(() => this._avgFromMetric('fillerCount'));
  readonly averageRepetitionScore = computed(() => this._avgFromMetric('repetitionScore'));
  readonly averagePauseCount = computed(() => this._avgFromMetric('pauseCount'));

  readonly totalPracticeMinutes = computed(() => {
    const reports = Array.from(this.reports().values());
    return Math.round(reports.reduce((sum, r) => sum + r.durationMinutes, 0));
  });

  readonly averageDuration = computed(() => {
    const reports = Array.from(this.reports().values());
    if (reports.length === 0) return 0;
    return Math.round(reports.reduce((sum, r) => sum + r.durationMinutes, 0) / reports.length);
  });

  readonly interviewsPerWeek = computed(() => {
    const interviews = this.interviews();
    if (interviews.length === 0) return 0;
    const sorted = [...interviews].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    const first = new Date(sorted[0].createdAt).getTime();
    const last = new Date(sorted[sorted.length - 1].createdAt).getTime();
    const weeksSpan = Math.max(1, Math.ceil((last - first) / (7 * 24 * 60 * 60 * 1000)));
    return Math.round((interviews.length / weeksSpan) * 10) / 10;
  });

  readonly totalInterviews = computed(() => this.interviews().length);

  readonly strongestCategory = computed(() => {
    const comm = this.averageCommunication();
    const tech = this.averageTechnical();
    const conf = this.averageConfidence();
    if (comm === 0 && tech === 0 && conf === 0) return null;
    if (tech >= comm && tech >= conf) return 'Technical';
    if (comm >= tech && comm >= conf) return 'Communication';
    return 'Confidence';
  });

  readonly weakestCategory = computed(() => {
    const comm = this.averageCommunication();
    const tech = this.averageTechnical();
    const conf = this.averageConfidence();
    const vals = [comm, tech, conf].filter((v) => v > 0);
    if (vals.length === 0) return null;
    const worst = Math.min(...vals);
    if (worst === tech) return 'Technical';
    if (worst === comm) return 'Communication';
    return 'Confidence';
  });

  readonly skillRadarData = computed(() => [
    { label: 'Overall', value: this.averageScore() },
    { label: 'Communication', value: this.averageCommunication() },
    { label: 'Technical', value: this.averageTechnical() },
    { label: 'Confidence', value: this.averageConfidence() },
    { label: 'Vocabulary', value: this.averageVocabularyRichness() },
  ]);

  readonly wpmTrend = computed((): TrendPoint[] => this._metricTrend('wordsPerMinute'));
  readonly vocabTrend = computed((): TrendPoint[] => this._metricTrend('vocabularyRichness'));
  readonly fillerTrend = computed((): TrendPoint[] => this._metricTrend('fillerCount'));

  readonly improvements = computed((): Insight[] => {
    const insights: Insight[] = [];
    const scoreTrend = this.scoreTrend();
    const confTrend = this.confidenceTrend();
    const commTrend = this.communicationTrend();
    const techTrend = this.technicalTrend();
    const wpmTrend = this._metricTrend('wordsPerMinute');
    const vocabTrend = this._metricTrend('vocabularyRichness');
    const fillerTrend = this._metricTrend('fillerCount');

    if (scoreTrend.length >= 4) {
      const half = Math.floor(scoreTrend.length / 2);
      const firstHalf = scoreTrend.slice(0, half);
      const secondHalf = scoreTrend.slice(half);
      const avg1 = firstHalf.reduce((s, p) => s + p.value, 0) / firstHalf.length;
      const avg2 = secondHalf.reduce((s, p) => s + p.value, 0) / secondHalf.length;
      const change = Math.round(avg2 - avg1);
      if (change > 0) {
        insights.push({
          id: 'score-improved',
          icon: 'trending_up',
          message: `Overall score improved by ${Math.abs(change).toFixed(1)} points across your recent interviews`,
          positive: true,
        });
      } else if (change < 0) {
        insights.push({
          id: 'score-declined',
          icon: 'trending_down',
          message: `Overall score decreased by ${Math.abs(change).toFixed(1)} points — focus on consistency`,
          positive: false,
        });
      }
    }

    if (confTrend.length >= 4) {
      const half = Math.floor(confTrend.length / 2);
      const firstHalf = confTrend.slice(0, half);
      const secondHalf = confTrend.slice(half);
      const avg1 = firstHalf.reduce((s, p) => s + p.value, 0) / firstHalf.length;
      const avg2 = secondHalf.reduce((s, p) => s + p.value, 0) / secondHalf.length;
      const change = Math.round(avg2 - avg1);
      if (change > 0) {
        insights.push({
          id: 'confidence-improved',
          icon: 'psychology',
          message: `Confidence increased by ${Math.abs(change).toFixed(1)} points — you're building composure`,
          positive: true,
        });
      } else if (change < -5) {
        insights.push({
          id: 'confidence-declined',
          icon: 'psychology_alt',
          message: `Confidence dropped by ${Math.abs(change).toFixed(1)} points — practice calming techniques`,
          positive: false,
        });
      }
    }

    if (commTrend.length >= 4) {
      const half = Math.floor(commTrend.length / 2);
      const firstHalf = commTrend.slice(0, half);
      const secondHalf = commTrend.slice(half);
      const avg1 = firstHalf.reduce((s, p) => s + p.value, 0) / firstHalf.length;
      const avg2 = secondHalf.reduce((s, p) => s + p.value, 0) / secondHalf.length;
      const change = Math.round(avg2 - avg1);
      if (change > 0) {
        insights.push({
          id: 'communication-improved',
          icon: 'record_voice_over',
          message: `Communication skills improved by ${Math.abs(change).toFixed(1)} points`,
          positive: true,
        });
      }
    }

    if (techTrend.length >= 4) {
      const half = Math.floor(techTrend.length / 2);
      const firstHalf = techTrend.slice(0, half);
      const secondHalf = techTrend.slice(half);
      const avg1 = firstHalf.reduce((s, p) => s + p.value, 0) / firstHalf.length;
      const avg2 = secondHalf.reduce((s, p) => s + p.value, 0) / secondHalf.length;
      const change = Math.round(avg2 - avg1);
      if (change === 0 && techTrend.length >= 6) {
        insights.push({
          id: 'technical-plateau',
          icon: 'speed',
          message: 'Technical score plateaued — try harder difficulty questions',
          positive: false,
        });
      } else if (change > 0) {
        insights.push({
          id: 'technical-improved',
          icon: 'code',
          message: `Technical performance improved by ${Math.abs(change).toFixed(1)} points`,
          positive: true,
        });
      }
    }

    if (wpmTrend.length >= 4) {
      const half = Math.floor(wpmTrend.length / 2);
      const firstHalf = wpmTrend.slice(0, half);
      const secondHalf = wpmTrend.slice(half);
      const avg1 = firstHalf.reduce((s, p) => s + p.value, 0) / firstHalf.length;
      const avg2 = secondHalf.reduce((s, p) => s + p.value, 0) / secondHalf.length;
      const diff = avg2 - avg1;
      if (Math.abs(diff) < 3) {
        insights.push({
          id: 'speed-stabilized',
          icon: 'speed',
          message: 'Speaking speed has stabilized — good pacing consistency',
          positive: true,
        });
      } else if (diff > 5) {
        insights.push({
          id: 'speed-increased',
          icon: 'fast_forward',
          message: `Speaking speed increased — ensure clarity isn't sacrificed`,
          positive: false,
        });
      }
    }

    if (vocabTrend.length >= 4) {
      const half = Math.floor(vocabTrend.length / 2);
      const firstHalf = vocabTrend.slice(0, half);
      const secondHalf = vocabTrend.slice(half);
      const avg1 = firstHalf.reduce((s, p) => s + p.value, 0) / firstHalf.length;
      const avg2 = secondHalf.reduce((s, p) => s + p.value, 0) / secondHalf.length;
      const change = avg2 - avg1;
      if (change > 0.02) {
        insights.push({
          id: 'vocab-improved',
          icon: 'menu_book',
          message: 'Vocabulary richness is improving — keep diversifying your word choice',
          positive: true,
        });
      }
    }

    if (fillerTrend.length >= 4) {
      const half = Math.floor(fillerTrend.length / 2);
      const firstHalf = fillerTrend.slice(0, half);
      const secondHalf = fillerTrend.slice(half);
      const avg1 = firstHalf.reduce((s, p) => s + p.value, 0) / firstHalf.length;
      const avg2 = secondHalf.reduce((s, p) => s + p.value, 0) / secondHalf.length;
      const change = avg2 - avg1;
      if (change < -1) {
        insights.push({
          id: 'fillers-decreased',
          icon: 'chat_bubble_outline',
          message: `Filler words decreased — your speech is becoming cleaner`,
          positive: true,
        });
      } else if (change > 2) {
        insights.push({
          id: 'fillers-increased',
          icon: 'chat_bubble',
          message: 'Filler words increasing — practice pausing instead of using fillers',
          positive: false,
        });
      }
    }

    return insights;
  });

  constructor() {
    super({ reports: new Map<string, InterviewReport>(), interviews: [] });
  }

  /**
   * Maximum number of concurrent report requests.
   * 4 balances backend load with perceived responsiveness:
   * - A single report takes ~50-150ms (network + generation).
   * - 4 in parallel fills the pipeline without overwhelming the backend (8 cores typical).
   * - 4 still provides a fast first paint because completed (batch) count ≤ 5-10 for most users.
   */
  private static readonly CONCURRENCY_LIMIT = 4;

  async loadAnalytics(): Promise<void> {
    this._startOperation('load');
    try {
      const interviewRes = await firstValueFrom(this._api.getInterviews());
      const allInterviews = interviewRes.data;
      this._setState({ interviews: allInterviews });

      const completed = allInterviews.filter((i) => i.status === 'COMPLETED');
      const reportsMap = new Map<string, InterviewReport>();

      if (completed.length > 0) {
        const failures: string[] = [];
        const results = await this._runWithConcurrency(
          completed,
          AnalyticsOverviewStore.CONCURRENCY_LIMIT,
          async (interview) => {
            try {
              const res = await firstValueFrom(this._api.getReport(interview.id));
              return { id: interview.id, report: res.data };
            } catch {
              failures.push(interview.id);
              return null;
            }
          },
        );
        for (const result of results) {
          if (result) {
            reportsMap.set(result.id, result.report);
          }
        }
        if (failures.length > 0) {
          console.warn(`[Analytics] ${failures.length} report(s) failed to load:`, failures);
        }
      }

      this._setState({ reports: reportsMap });
      this._completeOperation('load');
    } catch (err: unknown) {
      this._failOperation('load', extractErrorMessage(err, 'Failed to load analytics'));
    }
  }

  /**
   * Process items with a sliding window of concurrency, preserving input order.
   * More efficient than partition-then-flatten: avoids copying the array, avoids nested promise arrays.
   * Also simpler to reason about than a true channel-based worker pool.
   */
  private async _runWithConcurrency<T, R>(
    items: T[],
    limit: number,
    fn: (item: T) => Promise<R>,
  ): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let index = 0;

    async function worker(
      that: AnalyticsOverviewStore,
      res: R[],
    ): Promise<void> {
      while (index < items.length) {
        const i = index;
        index++;
        res[i] = await fn(items[i]);
      }
    }

    const workers: Promise<void>[] = [];
    for (let i = 0; i < Math.min(limit, items.length); i++) {
      workers.push(worker(this, results));
    }
    await Promise.all(workers);
    return results;
  }

  private _avgFromSummaries(key: 'overallScore' | 'confidenceScore' | 'communicationScore' | 'technicalScore'): number {
    const summaries = this.sortedSummaries();
    const scored = summaries.filter((s) => s[key] != null && s[key] > 0);
    if (scored.length === 0) return 0;
    return Math.round((scored.reduce((sum, s) => sum + s[key], 0) / scored.length) * 10) / 10;
  }

  private _avgFromMetric(key: 'wordsPerMinute' | 'vocabularyRichness' | 'keywordCoverage' | 'fillerCount' | 'repetitionScore' | 'pauseCount'): number {
    const reports = Array.from(this.reports().values());
    let sum = 0;
    let count = 0;
    for (const report of reports) {
      for (const q of report.questions) {
        if (q.metrics != null && q.metrics[key] != null) {
          sum += q.metrics[key];
          count++;
        }
      }
    }
    if (count === 0) return 0;
    return Math.round((sum / count) * 10) / 10;
  }

  private _metricTrend(key: 'wordsPerMinute' | 'vocabularyRichness' | 'fillerCount'): TrendPoint[] {
    const sorted = this.sortedSummaries();
    const trend: TrendPoint[] = [];
    let idx = 0;
    for (const summary of sorted) {
      const report = this.reports().get(summary.id);
      if (report == null) continue;
      let sum = 0;
      let count = 0;
      for (const q of report.questions) {
        if (q.metrics != null && q.metrics[key] != null) {
          sum += q.metrics[key];
          count++;
        }
      }
      if (count > 0) {
        trend.push({ value: Math.round((sum / count) * 10) / 10, index: idx });
        idx++;
      }
    }
    return trend;
  }

}
