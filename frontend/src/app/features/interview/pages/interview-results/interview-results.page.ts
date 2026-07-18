import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { IlResultsHeroComponent } from '../../components/results-hero/results-hero.component';
import { IlOverallScoreCardComponent } from '../../components/overall-score-card/overall-score-card.component';
import { IlMetricsGridComponent } from '../../components/metrics-grid/metrics-grid.component';
import { IlStrengthsCardComponent } from '../../components/strengths-card/strengths-card.component';
import { IlWeaknessesCardComponent } from '../../components/weaknesses-card/weaknesses-card.component';
import { IlFeedbackCardComponent } from '../../components/feedback-card/feedback-card.component';
import { IlQuestionReviewAccordionComponent } from '../../components/question-review-accordion/question-review-accordion.component';
import { IlButtonComponent } from '../../../../shared/components/button/button.component';
import { IlSpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { InterviewResultsStore } from '../../interview-results.store';

@Component({
  selector: 'il-interview-results',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatIconModule,
    IlResultsHeroComponent,
    IlOverallScoreCardComponent,
    IlMetricsGridComponent,
    IlStrengthsCardComponent,
    IlWeaknessesCardComponent,
    IlFeedbackCardComponent,
    IlQuestionReviewAccordionComponent,
    IlButtonComponent,
    IlSpinnerComponent,
  ],
  templateUrl: './interview-results.page.html',
})
export class InterviewResultsPage implements OnInit {
  private readonly _route = inject(ActivatedRoute);
  readonly store = inject(InterviewResultsStore);

  ngOnInit(): void {
    const id = this._route.snapshot.paramMap.get('id') ?? '';
    if (id) {
      this.store.loadResults(id);
    }
  }
}
