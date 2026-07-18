import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { IlCardComponent } from '@shared/components/card/card.component';
import { IlSparklineComponent, SparklineDataPoint } from '@shared/components/sparkline/sparkline.component';

@Component({
  selector: 'il-metric-trend-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, MatIconModule, IlCardComponent, IlSparklineComponent],
  templateUrl: './metric-trend-card.component.html',
})
export class IlMetricTrendCardComponent {
  title = input('');
  icon = input('analytics');
  trendData = input<SparklineDataPoint[]>([]);
  currentValue = input<number | null>(null);
  unit = input('');
  color = input('var(--il-primary-500)');
  changeDirection = input<'up' | 'down' | 'flat'>('flat');
  changeValue = input(0);
  showChange = input(true);

  formattedValue = computed(() => {
    const v = this.currentValue();
    if (v == null) return '—';
    return v % 1 === 0 ? v.toString() : v.toFixed(1);
  });

  formattedChange = computed(() => {
    const v = this.changeValue();
    if (v === 0) return '0';
    return v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1);
  });

  changeClass = computed(() => {
    const dir = this.changeDirection();
    if (dir === 'up') return 'text-success-500';
    if (dir === 'down') return 'text-danger-500';
    return 'text-neutral-400';
  });

  changeIcon = computed(() => {
    const dir = this.changeDirection();
    if (dir === 'up') return 'trending_up';
    if (dir === 'down') return 'trending_down';
    return 'trending_flat';
  });
}
