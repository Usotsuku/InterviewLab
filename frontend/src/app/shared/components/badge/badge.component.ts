import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'il-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  templateUrl: './badge.component.html',
})
export class IlBadgeComponent {
  variant = input<'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'>('neutral');
  icon = input<string>();

  badgeClass = computed(() => {
    const base = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold leading-tight';
    const variants: Record<string, string> = {
      neutral: 'bg-neutral-200 text-neutral-500',
      primary: 'bg-primary-50 text-primary-400 border border-primary-100',
      success: 'bg-success-50 text-success-400 border border-success-100',
      warning: 'bg-warning-50 text-warning-400 border border-warning-100',
      danger:  'bg-danger-50 text-danger-400 border border-danger-100',
      info:    'bg-primary-50 text-primary-400 border border-primary-100',
    };
    return `${base} ${variants[this.variant()]}`;
  });
}
