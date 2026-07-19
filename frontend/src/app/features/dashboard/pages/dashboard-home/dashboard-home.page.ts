import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardStore, DashboardState } from '../../dashboard.store';
import { AuthStore } from '@core/auth/auth.store';
import { ProfileViewStore } from '../../../profile/profile-view.store';
import { IlDashboardHeroComponent } from '../../components/dashboard-hero/dashboard-hero.component';
import { IlStatisticsCardsComponent, StatItem } from '../../components/statistics-cards/statistics-cards.component';
import { IlRecentInterviewsCardComponent } from '../../components/recent-interviews-card/recent-interviews-card.component';
import { IlProgressOverviewCardComponent } from '../../components/progress-overview-card/progress-overview-card.component';
import { IlSkillBreakdownCardComponent } from '../../components/skill-breakdown-card/skill-breakdown-card.component';
import { IlQuickActionsCardComponent } from '../../components/quick-actions-card/quick-actions-card.component';
import { IlSpinnerComponent } from '@shared/components/spinner/spinner.component';
import { IlCardComponent } from '@shared/components/card/card.component';
import { IlEmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { MatIconModule } from '@angular/material/icon';
import { formatScore } from '@shared/utils/score.utils';

@Component({
  selector: 'il-dashboard-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IlDashboardHeroComponent,
    IlStatisticsCardsComponent,
    IlRecentInterviewsCardComponent,
    IlProgressOverviewCardComponent,
    IlSkillBreakdownCardComponent,
    IlQuickActionsCardComponent,
    IlSpinnerComponent,
    IlCardComponent,
    IlEmptyStateComponent,
    MatIconModule,
  ],
  templateUrl: './dashboard-home.page.html',
})
export class DashboardHomePage implements OnInit {
  private readonly _dashboardStore = inject(DashboardStore);
  private readonly _authStore = inject(AuthStore);
  private readonly _router = inject(Router);
  private readonly _profileView = inject(ProfileViewStore);

  readonly router = this._router;

  readonly store = this._dashboardStore;
  readonly profileView = this._profileView;

  readonly userName = this._authStore.user;
  readonly loading = this._dashboardStore.loading;
  readonly error = this._dashboardStore.error;
  readonly totalInterviews = this._dashboardStore.totalInterviews;
  readonly completedCount = this._dashboardStore.completedCount;
  readonly averageScore = this._dashboardStore.averageScore;
  readonly averageConfidence = this._dashboardStore.averageConfidence;
  readonly completionRate = this._dashboardStore.completionRate;
  readonly recentInterviews = this._dashboardStore.recentInterviews;
  readonly interviewsThisWeek = this._dashboardStore.interviewsThisWeek;
  readonly interviewsThisMonth = this._dashboardStore.interviewsThisMonth;

  readonly stats = (): StatItem[] => [
    {
      label: 'Total Interviews',
      value: this.totalInterviews(),
      icon: 'interview',
      color: 'bg-primary-500',
    },
    {
      label: 'Completed',
      value: this.completedCount(),
      icon: 'check_circle',
      color: 'bg-success-500',
    },
    {
      label: 'Avg Score',
      value: formatScore(this.averageScore()),
      icon: 'star',
      color: 'bg-warning-500',
    },
    {
      label: 'This Week',
      value: this.interviewsThisWeek(),
      icon: 'date_range',
      color: 'bg-info',
    },
  ];

  ngOnInit(): void {
    this._dashboardStore.loadDashboard();
    this._profileView.load();
  }

  onViewAll(): void {
    this._router.navigate(['/history']);
  }
}
