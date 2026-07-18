import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { QuestionDifficulty, QuestionType } from '../../../../core/models/domain.enums';

@Component({
  selector: 'il-question-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  templateUrl: './question-card.component.html',
})
export class IlQuestionCardComponent {
  questionText = input.required<string>();
  questionType = input<QuestionType>();
  questionDifficulty = input<QuestionDifficulty>();
  topic = input<string>();

  typeLabel = computed(() => {
    const labels: Record<string, string> = {
      HR: 'HR',
      TECHNICAL: 'Technical',
      COMMUNICATION: 'Communication',
    };
    return this.questionType() ? labels[this.questionType()!] ?? 'Unknown' : null;
  });

  difficultyLabel = computed(() => {
    const labels: Record<string, string> = {
      EASY: 'Easy',
      MEDIUM: 'Medium',
      HARD: 'Hard',
    };
    return this.questionDifficulty() ? labels[this.questionDifficulty()!] ?? 'Unknown' : null;
  });

  difficultyClass = computed(() => {
    const map: Record<string, string> = {
      EASY: 'bg-success-50 text-success-600',
      MEDIUM: 'bg-warning-50 text-warning-600',
      HARD: 'bg-danger-50 text-danger-600',
    };
    return map[this.questionDifficulty() ?? ''] ?? 'bg-neutral-100 text-neutral-500';
  });
}
