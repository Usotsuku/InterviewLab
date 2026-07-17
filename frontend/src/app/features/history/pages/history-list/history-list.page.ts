import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'il-history-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule],
  template: `
    <section class="history">
      <h1>Interview History</h1>
      <p class="history__desc">Review all your past interview sessions and results.</p>
      <div class="history__empty il-card">
        <p>No sessions yet. <a routerLink="/interview">Start your first interview.</a></p>
      </div>
    </section>
  `,
  styles: [`
    .history__desc { margin-bottom: 24px; }
    .history__empty { text-align: center; padding: 40px; }
  `],
})
export class HistoryListPage {}
