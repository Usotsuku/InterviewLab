import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { InterviewSetupStore } from '../../interview-setup.store';
import { IlModeCardComponent } from '../../components/mode-card/mode-card.component';
import { IlDifficultySelectorComponent } from '../../components/difficulty-selector/difficulty-selector.component';
import { IlQuestionCountSelectorComponent } from '../../components/question-count-selector/question-count-selector.component';
import { IlInterviewSummaryCardComponent } from '../../components/interview-summary-card/interview-summary-card.component';
import { IlButtonComponent } from '../../../../shared/components/button/button.component';
import { IlSpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { IlEmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { InterviewMode } from '../../../../core/models/domain.enums';

@Component({
  selector: 'il-interview-setup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IlModeCardComponent,
    IlDifficultySelectorComponent,
    IlQuestionCountSelectorComponent,
    IlInterviewSummaryCardComponent,
    IlButtonComponent,
    IlSpinnerComponent,
    IlEmptyStateComponent,
  ],
  templateUrl: './interview-setup.page.html',
})
export class InterviewSetupPage implements OnInit {
  private readonly _router = inject(Router);
  readonly store = inject(InterviewSetupStore);
  readonly router = this._router;

  readonly modes: InterviewMode[] = [
    InterviewMode.TECHNICAL,
    InterviewMode.HR,
    InterviewMode.MIXED,
  ];

  ngOnInit(): void {
    this.store.loadProfile();
  }

  onModeChange(mode: InterviewMode): void {
    this.store.setMode(mode);
  }

  async onCreate(): Promise<void> {
    const interview = await this.store.createInterview();
    if (interview) {
      this._router.navigate(['/interview', interview.id, 'session']);
    }
  }

  onCancel(): void {
    this._router.navigate(['/dashboard']);
  }
}
