import { Component, input, output, computed, ChangeDetectionStrategy, inject, ElementRef, signal } from '@angular/core';
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

  private readonly _hostEl = inject(ElementRef<HTMLElement>);
  private readonly _hostAriaLabel = signal<string | null>(null);

  constructor() {
    this._hostAriaLabel.set(this._hostEl.nativeElement.getAttribute('aria-label'));
  }

  readonly ariaLabel = this._hostAriaLabel.asReadonly();

  buttonClass = computed(() => `il-btn il-btn--${this.variant()} il-btn--${this.size()}`);
}
