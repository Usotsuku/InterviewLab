import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'il-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './progress.component.html',
})
export class IlProgressComponent {
  value = input(0);
  variant = input<'primary' | 'success' | 'warning' | 'danger'>('primary');
  showLabel = input(false);

  clampedValue = computed(() => Math.max(0, Math.min(100, this.value())));

  fillClass = computed(() => {
    const map: Record<string, string> = {
      primary: 'bg-primary-500',
      success: 'bg-success-500',
      warning: 'bg-warning-500',
      danger:  'bg-danger-500',
    };
    return map[this.variant()];
  });
}
