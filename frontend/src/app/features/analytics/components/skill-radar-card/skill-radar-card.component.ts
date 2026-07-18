import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { IlCardComponent } from '@shared/components/card/card.component';

export interface RadarDataPoint {
  label: string;
  value: number;
}

@Component({
  selector: 'il-skill-radar-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IlCardComponent],
  templateUrl: './skill-radar-card.component.html',
  styleUrl: './skill-radar-card.component.scss',
})
export class IlSkillRadarCardComponent {
  data = input<RadarDataPoint[]>([]);

  readonly size = 200;
  readonly center = 100;
  readonly maxRadius = 80;
  readonly levels = 5;

  polygonPoints = computed(() => {
    const d = this.data();
    if (d.length < 3) return '';
    const n = d.length;
    return d
      .map((point, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const value = Math.max(0, Math.min(100, point.value));
        const radius = (value / 100) * this.maxRadius;
        const x = this.center + radius * Math.cos(angle);
        const y = this.center + radius * Math.sin(angle);
        return `${x},${y}`;
      })
      .join(' ');
  });

  backgroundPolygons = computed(() => {
    return Array.from({ length: this.levels }, (_, level) => {
      const ratio = (level + 1) / this.levels;
      const n = this.data().length;
      if (n < 3) return '';
      return Array.from({ length: n }, (_, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const radius = ratio * this.maxRadius;
        const x = this.center + radius * Math.cos(angle);
        const y = this.center + radius * Math.sin(angle);
        return `${x},${y}`;
      }).join(' ');
    });
  });

  axisLines = computed(() => {
    const d = this.data();
    const n = d.length;
    if (n < 3) return [];
    return d.map((point, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const x = this.center + this.maxRadius * Math.cos(angle);
      const y = this.center + this.maxRadius * Math.sin(angle);
      return { x1: this.center, y1: this.center, x2: x, y2: y };
    });
  });

  labelPositions = computed(() => {
    const d = this.data();
    const n = d.length;
    if (n < 3) return [];
    return d.map((point, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const labelRadius = this.maxRadius + 18;
      const x = this.center + labelRadius * Math.cos(angle);
      const y = this.center + labelRadius * Math.sin(angle);
      return { x, y, label: point.label, value: point.value };
    });
  });
}
