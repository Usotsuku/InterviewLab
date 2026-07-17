import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'il-history-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule],
  template: `
    <section class="history-detail">
      <button mat-stroked-button routerLink="/history">← Back to History</button>
      <h1 class="history-detail__title">Session Detail</h1>
      <p>Full session breakdown will be implemented in the next sprint.</p>
    </section>
  `,
  styles: [`
    .history-detail__title { margin: 20px 0 12px; }
  `],
})
export class HistoryDetailPage {}
