import { Component, output, ChangeDetectionStrategy } from '@angular/core';
import { IlEmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

@Component({
  selector: 'il-interview-history-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IlEmptyStateComponent],
  templateUrl: './interview-history-empty-state.component.html',
})
export class IlInterviewHistoryEmptyStateComponent {
  startInterview = output<void>();
}
