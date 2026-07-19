import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { IlProgressComponent } from '../../../../shared/components/progress/progress.component';
import { scoreVariant } from '@shared/utils/score.utils';

interface MetricItem {
  label: string;
  value: number | null;
  icon: string;
  variant: 'primary' | 'success' | 'warning' | 'danger';
}

@Component({
  selector: 'il-metrics-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, IlProgressComponent],
  templateUrl: './metrics-grid.component.html',
})
export class IlMetricsGridComponent {
  overallScore = input<number | null>(null);
  communicationScore = input<number | null>(null);
  technicalScore = input<number | null>(null);
  confidenceScore = input<number | null>(null);

  metrics = computed<MetricItem[]>(() => [
    {
      label: 'Overall',
      value: this.overallScore(),
      icon: 'emoji_events',
      variant: this._scoreVariant(this.overallScore()),
    },
    {
      label: 'Communication',
      value: this.communicationScore(),
      icon: 'record_voice_over',
      variant: this._scoreVariant(this.communicationScore()),
    },
    {
      label: 'Technical',
      value: this.technicalScore(),
      icon: 'code',
      variant: this._scoreVariant(this.technicalScore()),
    },
    {
      label: 'Confidence',
      value: this.confidenceScore(),
      icon: 'psychology',
      variant: this._scoreVariant(this.confidenceScore()),
    },
  ]);

  hasAnyScore = computed(() => this.metrics().some((m) => m.value !== null));

  private _scoreVariant = scoreVariant;

  formatValue(value: number | null): string {
    return value !== null ? `${Math.round(value)}` : '--';
  }
}
