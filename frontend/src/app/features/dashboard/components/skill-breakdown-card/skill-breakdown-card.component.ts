import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { IlCardComponent } from '@shared/components/card/card.component';
import { IlProgressComponent } from '@shared/components/progress/progress.component';

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
