import { Component, input, output, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Question } from '../../../../core/models/domain.models';
import { QuestionType, QuestionDifficulty } from '../../../../core/models/domain.enums';

@Component({
  selector: 'il-question-review-accordion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  templateUrl: './question-review-accordion.component.html',
})
export class IlQuestionReviewAccordionComponent {
  questions = input<Question[]>([]);

  expandedIndex = signal<number | null>(null);

  toggle(index: number): void {
    this.expandedIndex.update((current) => (current === index ? null : index));
  }

  isExpanded(index: number): boolean {
    return this.expandedIndex() === index;
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggle(index);
    }
  }

  typeBadgeClass(type: QuestionType): string {
    const map: Record<string, string> = {
      TECHNICAL: 'bg-primary-50 text-primary-600',
      HR: 'bg-success-50 text-success-600',
      COMMUNICATION: 'bg-warning-50 text-warning-600',
    };
    return map[type] ?? 'bg-neutral-100 text-neutral-500';
  }

  difficultyBadgeClass(difficulty: QuestionDifficulty): string {
    const map: Record<string, string> = {
      EASY: 'bg-success-50 text-success-600',
      MEDIUM: 'bg-warning-50 text-warning-600',
      HARD: 'bg-danger-50 text-danger-600',
    };
    return map[difficulty] ?? 'bg-neutral-100 text-neutral-500';
  }
}
