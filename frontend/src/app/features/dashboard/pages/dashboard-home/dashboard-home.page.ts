import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'il-dashboard-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, RouterLink],
  template: `
    <section class="dashboard">
      <header class="dashboard__header">
        <h1 class="dashboard__title">Dashboard</h1>
        <button mat-raised-button color="primary" routerLink="/interview">
          Start New Interview
        </button>
      </header>

      <!-- Score cards row -->
      <div class="dashboard__cards">
        <div class="il-card dashboard__stat">
          <p class="dashboard__stat-label">Overall Score</p>
          <p class="dashboard__stat-value">—</p>
        </div>
        <div class="il-card dashboard__stat">
          <p class="dashboard__stat-label">Communication</p>
          <p class="dashboard__stat-value">—</p>
        </div>
        <div class="il-card dashboard__stat">
          <p class="dashboard__stat-label">Technical</p>
          <p class="dashboard__stat-value">—</p>
        </div>
        <div class="il-card dashboard__stat">
          <p class="dashboard__stat-label">Sessions</p>
          <p class="dashboard__stat-value">0</p>
        </div>
      </div>

      <!-- Recent activity placeholder -->
      <div class="il-card dashboard__recent">
        <h3>Recent Sessions</h3>
        <p>No interview sessions yet. <a routerLink="/interview">Start your first one.</a></p>
      </div>
    </section>
  `,
  styles: [`
    .dashboard__header {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px;
    }
    .dashboard__title { margin: 0; }
    .dashboard__cards {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;
    }
    .dashboard__stat { text-align: center; }
    .dashboard__stat-label { font-size: var(--il-font-sm); color: var(--il-text-muted); margin-bottom: 8px; }
    .dashboard__stat-value { font-size: var(--il-font-3xl); font-weight: 700; color: var(--il-primary-400); margin: 0; }
    .dashboard__recent h3 { margin-bottom: 12px; }
  `],
})
export class DashboardHomePage {}
