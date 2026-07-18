import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { IlCardComponent } from '@shared/components/card/card.component';
import { Insight } from '../../analytics-overview.store';

@Component({
  selector: 'il-improvement-insights-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, MatIconModule, IlCardComponent],
  templateUrl: './improvement-insights-card.component.html',
})
export class IlImprovementInsightsCardComponent {
  insights = input<Insight[]>([]);

  iconBgClass(positive: boolean): string {
    return positive ? 'bg-success-50 text-success-500' : 'bg-warning-50 text-warning-500';
  }
}
