import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { InterviewMode, QuestionDifficulty } from '../../../../core/models/domain.enums';

@Component({
  selector: 'il-interview-summary-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  templateUrl: './interview-summary-card.component.html',
})
export class IlInterviewSummaryCardComponent {
  mode = input.required<InterviewMode>();
  difficulty = input.required<QuestionDifficulty>();
  questionCount = input.required<number>();
  estimatedMinutes = input.required<number>();
  disabled = input(false);

  readonly modeLabel = computed(() => {
    const labels: Record<InterviewMode, string> = {
      HR: 'HR & Behavioral',
      TECHNICAL: 'Technical',
      MIXED: 'Mixed',
    };
    return labels[this.mode()];
  });

  readonly difficultyLabel = computed(() => {
    const labels: Record<QuestionDifficulty, string> = {
      EASY: 'Easy',
      MEDIUM: 'Medium',
      HARD: 'Hard',
    };
    return labels[this.difficulty()];
  });

  readonly difficultyIcon = computed(() => {
    const icons: Record<QuestionDifficulty, string> = {
      EASY: 'sentiment_satisfied',
      MEDIUM: 'sentiment_neutral',
      HARD: 'psychology',
    };
    return icons[this.difficulty()];
  });

  readonly durationText = computed(() => {
    const minutes = this.estimatedMinutes();
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
  });
}
