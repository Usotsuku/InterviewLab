import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { IlBadgeComponent } from '@shared/components/badge/badge.component';
import { InterviewStatus } from '@core/models/domain.enums';

@Component({
  selector: 'il-interview-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IlBadgeComponent],
  templateUrl: './interview-status-badge.component.html',
})
export class IlInterviewStatusBadgeComponent {
  status = input.required<InterviewStatus>();

  badgeVariant = computed(() => {
    const map: Record<string, 'success' | 'warning' | 'danger' | 'neutral' | 'primary' | 'info'> = {
      COMPLETED: 'success',
      IN_PROGRESS: 'info',
      READY: 'primary',
      CREATED: 'neutral',
      GENERATING: 'warning',
      FAILED: 'danger',
      CANCELLED: 'danger',
    };
    return map[this.status()] ?? 'neutral';
  });

  label = computed(() => {
    const map: Record<string, string> = {
      COMPLETED: 'Completed',
      IN_PROGRESS: 'In Progress',
      READY: 'Ready',
      CREATED: 'Draft',
      GENERATING: 'Generating',
      FAILED: 'Failed',
      CANCELLED: 'Cancelled',
    };
    return map[this.status()] ?? this.status();
  });

  icon = computed(() => {
    const map: Record<string, string> = {
      COMPLETED: 'check_circle',
      IN_PROGRESS: 'play_circle',
      READY: 'schedule',
      CREATED: 'edit',
      GENERATING: 'hourglass_top',
      FAILED: 'error',
      CANCELLED: 'cancel',
    };
    return map[this.status()] ?? 'help_outline';
  });
}
