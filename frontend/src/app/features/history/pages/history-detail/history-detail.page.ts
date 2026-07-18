import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { HistoryDetailStore } from '../../history-detail.store';
import { IlCardComponent } from '@shared/components/card/card.component';
import { IlBadgeComponent } from '@shared/components/badge/badge.component';
import { IlButtonComponent } from '@shared/components/button/button.component';
import { IlProgressComponent } from '@shared/components/progress/progress.component';
import { IlSpinnerComponent } from '@shared/components/spinner/spinner.component';
import { IlInterviewStatusBadgeComponent } from '../../components/interview-status-badge/interview-status-badge.component';
import { QuestionReport } from '@core/models/domain.models';

@Component({
  selector: 'il-history-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatIconModule,
    IlCardComponent,
    IlBadgeComponent,
    IlButtonComponent,
    IlProgressComponent,
    IlSpinnerComponent,
    IlInterviewStatusBadgeComponent,
  ],
  templateUrl: './history-detail.page.html',
})
export class HistoryDetailPage implements OnInit {
  readonly store = inject(HistoryDetailStore);
  private readonly _route = inject(ActivatedRoute);

  ngOnInit(): void {
    const id = this._route.snapshot.paramMap.get('id');
    if (id) {
      this.store.loadReport(id);
    }
  }

  formatScore(value: number | null | undefined): string {
    return value != null ? value.toFixed(1) : '—';
  }

  scoreVariant(value: number | null | undefined): 'primary' | 'success' | 'warning' | 'danger' {
    if (value == null) return 'primary';
    if (value >= 80) return 'success';
    if (value >= 60) return 'warning';
    return 'danger';
  }

  difficultyVariant(difficulty: string): 'neutral' | 'success' | 'warning' | 'danger' {
    const map: Record<string, 'neutral' | 'success' | 'warning' | 'danger'> = {
      EASY: 'success',
      MEDIUM: 'warning',
      HARD: 'danger',
    };
    return map[difficulty] ?? 'neutral';
  }

  typeIcon(type: string): string {
    const map: Record<string, string> = {
      TECHNICAL: 'code',
      HR: 'people',
      COMMUNICATION: 'record_voice_over',
    };
    return map[type] ?? 'help_outline';
  }

  trackByQuestionId(_index: number, q: QuestionReport): string {
    return q.questionId;
  }
}
