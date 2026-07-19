import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { IlCardComponent } from '@shared/components/card/card.component';
import { IlProgressComponent } from '@shared/components/progress/progress.component';
import { formatScore, scoreVariant } from '@shared/utils/score.utils';

@Component({
  selector: 'il-skill-breakdown-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IlCardComponent, IlProgressComponent],
  templateUrl: './skill-breakdown-card.component.html',
})
export class IlSkillBreakdownCardComponent {
  communicationScore = input<number | null>(null);
  technicalScore = input<number | null>(null);
  confidenceScore = input<number | null>(null);

  formatScore = formatScore;
  scoreVariant = scoreVariant;
}
