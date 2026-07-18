import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { QuestionDifficulty } from '../../../../core/models/domain.enums';

@Component({
  selector: 'il-difficulty-selector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './difficulty-selector.component.html',
})
export class IlDifficultySelectorComponent {
  selected = input.required<QuestionDifficulty>();
  disabled = input(false);

  selectedChange = output<QuestionDifficulty>();

  readonly options: { value: QuestionDifficulty; label: string }[] = [
    { value: QuestionDifficulty.EASY, label: 'Easy' },
    { value: QuestionDifficulty.MEDIUM, label: 'Medium' },
    { value: QuestionDifficulty.HARD, label: 'Hard' },
  ];

  readonly description = computed(() => {
    const descriptions: Record<QuestionDifficulty, string> = {
      EASY: 'Fundamental concepts, straightforward questions',
      MEDIUM: 'Moderate complexity, real-world scenarios',
      HARD: 'Advanced topics, deep technical challenges',
    };
    return descriptions[this.selected()];
  });

  onSelect(value: QuestionDifficulty): void {
    if (!this.disabled()) {
      this.selectedChange.emit(value);
    }
  }

  onKeydown(event: KeyboardEvent, value: QuestionDifficulty): void {
    if ((event.key === 'Enter' || event.key === ' ') && !this.disabled()) {
      event.preventDefault();
      this.selectedChange.emit(value);
    }
  }

  buttonClass(value: QuestionDifficulty): string {
    const base = 'px-4 py-2 text-sm font-medium transition-all duration-fast rounded-lg';
    if (this.disabled()) {
      return `${base} opacity-50 cursor-not-allowed bg-neutral-100 text-neutral-400`;
    }
    return this.selected() === value
      ? `${base} bg-neutral-800 text-white`
      : `${base} bg-neutral-100 text-neutral-500 hover:bg-neutral-200`;
  }
}
