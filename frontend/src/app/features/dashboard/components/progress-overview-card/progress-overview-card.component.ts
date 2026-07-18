import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { IlCardComponent } from '@shared/components/card/card.component';
import { IlProgressComponent } from '@shared/components/progress/progress.component';

@Component({
  selector: 'il-progress-overview-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IlCardComponent, IlProgressComponent],
  templateUrl: './progress-overview-card.component.html',
})
export class IlProgressOverviewCardComponent {
  averageScore = input<number | null>(null);
  averageConfidence = input<number | null>(null);
  completionRate = input(0);
  interviewsThisWeek = input(0);
  interviewsThisMonth = input(0);

  formatScore(value: number | null): string {
    return value != null ? value.toFixed(1) : '—';
  }

  scoreVariant(value: number | null): 'primary' | 'success' | 'warning' | 'danger' {
    if (value == null) return 'primary';
    if (value >= 80) return 'success';
    if (value >= 60) return 'warning';
    return 'danger';
  }
}
