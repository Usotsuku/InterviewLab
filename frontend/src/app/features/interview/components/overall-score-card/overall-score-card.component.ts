import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { scoreVariant } from '@shared/utils/score.utils';

@Component({
  selector: 'il-overall-score-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './overall-score-card.component.html',
  styleUrl: './overall-score-card.component.scss',
})
export class IlOverallScoreCardComponent {
  score = input<number | null>(null);
  grade = input<string | null>(null);
  summary = input<string | null>(null);

  hasScore = computed(() => this.score() !== null);

  scoreLabel = computed(() => {
    const s = this.score();
    if (s === null) return '--';
    return String(Math.round(s));
  });

  circumference = 2 * Math.PI * 54;
  strokeDashoffset = computed(() => {
    const s = this.score();
    if (s === null) return this.circumference;
    const progress = Math.max(0, Math.min(100, s)) / 100;
    return this.circumference * (1 - progress);
  });

  scoreColor = computed(() => {
    const s = this.score();
    if (s === null) return 'var(--il-neutral-300)';
    const v = scoreVariant(s);
    const map: Record<string, string> = {
      success: 'var(--il-success-500, #22c55e)',
      warning: 'var(--il-warning-500, #f59e0b)',
      danger: 'var(--il-danger-500, #ef4444)',
    };
    return map[v] ?? 'var(--il-primary-500)';
  });
}
