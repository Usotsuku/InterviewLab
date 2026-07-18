import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { IlBadgeComponent } from '../../../../shared/components/badge/badge.component';
import { InterviewMode } from '../../../../core/models/domain.enums';

@Component({
  selector: 'il-results-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, IlBadgeComponent],
  templateUrl: './results-hero.component.html',
})
export class IlResultsHeroComponent {
  title = input('Interview Session');
  mode = input<string>('');
  completedAt = input<string | null>(null);
  isCompleted = input(false);
  overallScore = input<number | null>(null);

  modeLabel = computed(() => {
    const labels: Record<string, string> = {
      HR: 'HR & Behavioral',
      TECHNICAL: 'Technical',
      MIXED: 'Mixed',
    };
    return labels[this.mode()] ?? this.mode();
  });

  formattedDate = computed(() => {
    const date = this.completedAt();
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });

  formattedTime = computed(() => {
    const date = this.completedAt();
    if (!date) return null;
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  });

  completionBadgeVariant = computed(() => this.isCompleted() ? 'success' as const : 'warning' as const);
}
