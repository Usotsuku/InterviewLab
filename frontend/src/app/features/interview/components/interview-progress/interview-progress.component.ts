import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { IlProgressComponent } from '../../../../shared/components/progress/progress.component';

@Component({
  selector: 'il-interview-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IlProgressComponent],
  templateUrl: './interview-progress.component.html',
})
export class IlInterviewProgressComponent {
  currentQuestion = input(1);
  totalQuestions = input(10);
  mode = input<string>('');

  progressPercent = computed(() => {
    const total = this.totalQuestions();
    if (total === 0) return 0;
    return Math.round((this.currentQuestion() / total) * 100);
  });

  progressLabel = computed(() => `${this.currentQuestion()} / ${this.totalQuestions()}`);
}
