import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

export interface SparklineDataPoint {
  value: number;
  index: number;
  label?: string;
}

@Component({
  selector: 'il-sparkline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sparkline.component.html',
  styleUrl: './sparkline.component.scss',
})
export class IlSparklineComponent {
  data = input<SparklineDataPoint[]>([]);
  color = input('var(--il-primary-500)');
  height = input(40);
  showArea = input(true);
  showDots = input(false);

  readonly viewBoxWidth = 200;
  readonly viewBoxHeight = 50;
  readonly padding = 2;

  points = computed(() => {
    const d = this.data();
    if (d.length === 0) return '';
    const vals = d.map((p) => p.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;
    const step = d.length > 1
      ? (this.viewBoxWidth - this.padding * 2) / (d.length - 1)
      : 0;

    return d
      .map((p, i) => {
        const x = this.padding + i * step;
        const y = this.viewBoxHeight - this.padding - ((p.value - min) / range) * (this.viewBoxHeight - this.padding * 2);
        return `${x},${y}`;
      })
      .join(' ');
  });

  areaPath = computed(() => {
    const d = this.data();
    if (d.length === 0) return '';
    const vals = d.map((p) => p.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;
    const step = d.length > 1
      ? (this.viewBoxWidth - this.padding * 2) / (d.length - 1)
      : 0;

    const pts = d.map((p, i) => {
      const x = this.padding + i * step;
      const y = this.viewBoxHeight - this.padding - ((p.value - min) / range) * (this.viewBoxHeight - this.padding * 2);
      return `${x},${y}`;
    });

    const firstX = this.padding;
    const lastX = this.padding + (d.length - 1) * step;
    const bottom = this.viewBoxHeight - this.padding;

    return `M${firstX},${bottom} L${pts.join(' L')} L${lastX},${bottom} Z`;
  });

  dotPositions = computed(() => {
    const d = this.data();
    if (d.length === 0) return [];
    const vals = d.map((p) => p.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;
    const step = d.length > 1
      ? (this.viewBoxWidth - this.padding * 2) / (d.length - 1)
      : 0;

    return d.map((p, i) => {
      const x = this.padding + i * step;
      const y = this.viewBoxHeight - this.padding - ((p.value - min) / range) * (this.viewBoxHeight - this.padding * 2);
      return { x, y, value: p.value, label: p.label };
    });
  });

  colorId = computed(() => `spark-${Math.random().toString(36).substring(2, 8)}`);
}
