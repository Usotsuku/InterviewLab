import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'il-question-count-selector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  templateUrl: './question-count-selector.component.html',
})
export class IlQuestionCountSelectorComponent {
  value = input.required<number>();
  disabled = input(false);

  valueChange = output<number>();

  readonly options = [5, 10, 15, 20];

  readonly description = computed(() => {
    const count = this.value();
    const minutes = count * 2;
    return `${count} questions · ~${minutes} minutes`;
  });

  onSelect(count: number): void {
    if (!this.disabled()) {
      this.valueChange.emit(count);
    }
  }

  onKeydown(event: KeyboardEvent, count: number): void {
    if ((event.key === 'Enter' || event.key === ' ') && !this.disabled()) {
      event.preventDefault();
      this.valueChange.emit(count);
    }
  }

  onSliderInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value, 10);
    if (!this.disabled() && !isNaN(value)) {
      this.valueChange.emit(value);
    }
  }

  buttonClass(count: number): string {
    const base = 'w-12 h-12 rounded-lg text-sm font-semibold transition-all duration-fast flex items-center justify-center';
    if (this.disabled()) {
      return `${base} opacity-50 cursor-not-allowed bg-neutral-100 text-neutral-400`;
    }
    return this.value() === count
      ? `${base} bg-neutral-800 text-white`
      : `${base} bg-neutral-100 text-neutral-500 hover:bg-neutral-200`;
  }
}
