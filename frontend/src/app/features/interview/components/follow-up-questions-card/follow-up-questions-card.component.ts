import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'il-follow-up-questions-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  templateUrl: './follow-up-questions-card.component.html',
})
export class IlFollowUpQuestionsCardComponent {
  questions = input<string[]>([]);
}
