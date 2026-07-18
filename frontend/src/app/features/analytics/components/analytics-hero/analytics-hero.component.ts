import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'il-analytics-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  templateUrl: './analytics-hero.component.html',
})
export class IlAnalyticsHeroComponent {
  userName = input('');
  totalInterviews = input(0);
  completedCount = input(0);
  averageScore = input<number | null>(null);
}
