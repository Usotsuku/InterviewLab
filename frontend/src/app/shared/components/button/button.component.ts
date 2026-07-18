import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type IlButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type IlButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'il-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class IlButtonComponent {
  variant = input<IlButtonVariant>('primary');
  size = input<IlButtonSize>('md');
  disabled = input(false);
  loading = input(false);
  icon = input<string>();
  type = input<'button' | 'submit' | 'reset'>('button');

  clicked = output<Event>();

  buttonClass = computed(() => `il-btn il-btn--${this.variant()} il-btn--${this.size()}`);
}
