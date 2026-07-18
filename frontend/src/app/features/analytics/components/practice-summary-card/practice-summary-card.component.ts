import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { IlCardComponent } from '@shared/components/card/card.component';

@Component({
  selector: 'il-practice-summary-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, IlCardComponent],
  templateUrl: './practice-summary-card.component.html',
})
export class IlPracticeSummaryCardComponent {
  totalInterviews = input(0);
  completedCount = input(0);
  totalPracticeMinutes = input(0);
  averageDuration = input(0);
  interviewsPerWeek = input(0);
  strongestCategory = input<string | null>(null);
  weakestCategory = input<string | null>(null);

  stats = computed(() => [
    {
      label: 'Total Practice',
      value: this._formatMinutes(this.totalPracticeMinutes()),
      icon: 'schedule',
    },
    {
      label: 'Avg Duration',
      value: this._formatMinutes(this.averageDuration()),
      icon: 'timer',
    },
    {
      label: 'Pace',
      value: `${this.interviewsPerWeek()} / week`,
      icon: 'speed',
    },
    {
      label: 'Completion',
      value: `${this.totalInterviews() > 0 ? Math.round((this.completedCount() / this.totalInterviews()) * 100) : 0}%`,
      icon: 'check_circle',
    },
  ]);

  private _formatMinutes(minutes: number): string {
    if (minutes === 0) return '—';
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }
}
