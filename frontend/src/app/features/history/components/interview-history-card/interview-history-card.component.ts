import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { IlCardComponent } from '@shared/components/card/card.component';
import { IlButtonComponent } from '@shared/components/button/button.component';
import { IlInterviewStatusBadgeComponent } from '../interview-status-badge/interview-status-badge.component';
import { Interview } from '@core/models/domain.models';
import { InterviewMode } from '@core/models/domain.enums';

@Component({
  selector: 'il-interview-history-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, IlCardComponent, IlButtonComponent, IlInterviewStatusBadgeComponent],
  templateUrl: './interview-history-card.component.html',
})
export class IlInterviewHistoryCardComponent {
  interview = input.required<Interview>();
  deleteClick = output<string>();

  modeLabel = input<'HR' | 'TECHNICAL' | 'MIXED' | string>();

  modeIcon(): string {
    const icons: Record<string, string> = {
      [InterviewMode.HR]: 'people',
      [InterviewMode.TECHNICAL]: 'code',
      [InterviewMode.MIXED]: 'merge',
    };
    return icons[this.interview().mode] ?? 'interview';
  }

  formattedDate(): string {
    const d = this.interview().createdAt;
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  onDelete(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.deleteClick.emit(this.interview().id);
  }
}
