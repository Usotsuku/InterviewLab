import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { IlCardComponent } from '@shared/components/card/card.component';
import { IlButtonComponent } from '@shared/components/button/button.component';
import { IlInterviewStatusBadgeComponent } from '@features/history/components/interview-status-badge/interview-status-badge.component';
import { Interview } from '@core/models/domain.models';

@Component({
  selector: 'il-recent-interviews-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, IlCardComponent, IlButtonComponent, IlInterviewStatusBadgeComponent],
  templateUrl: './recent-interviews-card.component.html',
})
export class IlRecentInterviewsCardComponent {
  interviews = input<Interview[]>([]);
  viewAllClick = output<void>();

  formattedDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}
