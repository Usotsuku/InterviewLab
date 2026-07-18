import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { AnalyticsOverviewStore } from '../../analytics-overview.store';
import { AuthStore } from '@core/auth/auth.store';
import { IlSpinnerComponent } from '@shared/components/spinner/spinner.component';
import { IlEmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import {
  IlAnalyticsHeroComponent,
  IlMetricTrendCardComponent,
  IlScoreTrendsCardComponent,
  IlSpeakingMetricsCardComponent,
  IlSkillRadarCardComponent,
  IlImprovementInsightsCardComponent,
  IlPracticeSummaryCardComponent,
} from '../../components';

@Component({
  selector: 'il-analytics-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IlSpinnerComponent,
    IlEmptyStateComponent,
    IlAnalyticsHeroComponent,
    IlMetricTrendCardComponent,
    IlScoreTrendsCardComponent,
    IlSpeakingMetricsCardComponent,
    IlSkillRadarCardComponent,
    IlImprovementInsightsCardComponent,
    IlPracticeSummaryCardComponent,
  ],
  templateUrl: './analytics-overview.page.html',
})
export class AnalyticsOverviewPage implements OnInit {
  private readonly _analyticsStore = inject(AnalyticsOverviewStore);
  private readonly _authStore = inject(AuthStore);

  readonly store = this._analyticsStore;
  readonly userName = this._authStore.user;
  readonly loading = this._analyticsStore.loading;
  readonly error = this._analyticsStore.error;
  readonly completedCount = this._analyticsStore.completedCount;

  ngOnInit(): void {
    this._analyticsStore.loadAnalytics();
  }
}
