import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { IlInterviewHistoryCardComponent } from '../interview-history-card/interview-history-card.component';
import { IlInterviewHistoryEmptyStateComponent } from '../interview-history-empty-state/interview-history-empty-state.component';
import { Interview } from '@core/models/domain.models';

@Component({
  selector: 'il-interview-history-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IlInterviewHistoryCardComponent, IlInterviewHistoryEmptyStateComponent],
  templateUrl: './interview-history-list.component.html',
})
export class IlInterviewHistoryListComponent {
  interviews = input<Interview[]>([]);
  isEmpty = input(false);
  deleteInterview = output<string>();
  startInterview = output<void>();

  onDeleteInterview(id: string): void {
    this.deleteInterview.emit(id);
  }
}
