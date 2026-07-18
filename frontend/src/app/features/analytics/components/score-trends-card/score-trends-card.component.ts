import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { IlCardComponent } from '@shared/components/card/card.component';
import { IlSparklineComponent, SparklineDataPoint } from '@shared/components/sparkline/sparkline.component';

@Component({
  selector: 'il-score-trends-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, IlCardComponent, IlSparklineComponent],
  templateUrl: './score-trends-card.component.html',
})
export class IlScoreTrendsCardComponent {
  scoreTrend = input<SparklineDataPoint[]>([]);
  confidenceTrend = input<SparklineDataPoint[]>([]);
  communicationTrend = input<SparklineDataPoint[]>([]);
  technicalTrend = input<SparklineDataPoint[]>([]);

  averageScore = input(0);
  averageConfidence = input(0);
  averageCommunication = input(0);
  averageTechnical = input(0);

  formatScore(value: number): string {
    if (value === 0) return '—';
    return value.toFixed(1);
  }

  variantClass(value: number): string {
    if (value === 0) return 'text-neutral-400';
    if (value >= 80) return 'text-success-500';
    if (value >= 60) return 'text-warning-500';
    return 'text-danger-500';
  }

  barWidth(value: number): number {
    return Math.max(0, Math.min(100, value));
  }

  barVariant(value: number): string {
    if (value === 0) return 'bg-neutral-200';
    if (value >= 80) return 'bg-success-500';
    if (value >= 60) return 'bg-warning-500';
    return 'bg-danger-500';
  }
}
