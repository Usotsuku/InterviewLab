import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { IlCardComponent } from '@shared/components/card/card.component';
import { IlProgressComponent } from '@shared/components/progress/progress.component';
import { formatScore, scoreVariant } from '@shared/utils/score.utils';

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

  formatScore = formatScore;
  scoreVariant = scoreVariant;
}
