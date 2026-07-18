import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InterviewMode, QuestionDifficulty } from '../../../../core/models/domain.enums';

@Component({
  selector: 'il-interview-setup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatSelectModule, MatFormFieldModule, FormsModule],
  templateUrl: './interview-setup.page.html',
})
export class InterviewSetupPage {
  private readonly _router = inject(Router);
  mode: InterviewMode = InterviewMode.TECHNICAL;
  difficulty: QuestionDifficulty = QuestionDifficulty.MEDIUM;
  questionCount = 10;

  onStart(): void {
    this._router.navigate(['/interview', 'mock_session_id', 'session']);
  }
}
