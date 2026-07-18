import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'il-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
})
export class IlCardComponent {
  title = input<string>();
  variant = input<'flat' | 'elevated'>('elevated');

  cardClass = computed(() => `il-card il-card--${this.variant()}`);
}
