import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'il-analytics-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <section class="analytics">
      <h1>Analytics</h1>
      <p>Detailed performance charts and trend analysis will be available here.</p>
      <div class="analytics__grid">
        <div class="il-card analytics__chart-placeholder">
          <h3>Score Over Time</h3>
          <div class="analytics__chart-area">Chart placeholder</div>
        </div>
        <div class="il-card analytics__chart-placeholder">
          <h3>Communication Metrics</h3>
          <div class="analytics__chart-area">Chart placeholder</div>
        </div>
        <div class="il-card analytics__chart-placeholder">
          <h3>Words Per Minute</h3>
          <div class="analytics__chart-area">Chart placeholder</div>
        </div>
        <div class="il-card analytics__chart-placeholder">
          <h3>Filler Word Frequency</h3>
          <div class="analytics__chart-area">Chart placeholder</div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .analytics__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 24px; }
    .analytics__chart-area {
      height: 160px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--il-text-muted);
      background: var(--il-surface-2);
      border-radius: var(--il-radius-sm);
      margin-top: 16px;
      font-size: var(--il-font-sm);
      font-style: italic;
    }
  `],
})
export class AnalyticsOverviewPage {}
