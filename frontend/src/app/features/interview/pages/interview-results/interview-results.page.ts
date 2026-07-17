import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'il-interview-results',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule, MatTabsModule],
  template: `
    <section class="results">
      <h1>Session Results</h1>
      <p class="results__subtitle">Here is a breakdown of your performance.</p>

      <!-- Score Summary -->
      <div class="results__scores">
        <div class="il-card results__score-card">
          <p class="results__score-label">Overall</p>
          <p class="results__score-value">—</p>
        </div>
        <div class="il-card results__score-card">
          <p class="results__score-label">Communication</p>
          <p class="results__score-value">—</p>
        </div>
        <div class="il-card results__score-card">
          <p class="results__score-label">Technical</p>
          <p class="results__score-value">—</p>
        </div>
        <div class="il-card results__score-card">
          <p class="results__score-label">Confidence</p>
          <p class="results__score-value">—</p>
        </div>
      </div>

      <!-- Per-Answer Tabs -->
      <mat-tab-group class="results__tabs">
        <mat-tab label="Answer Breakdown">
          <p class="results__placeholder">Answer details will appear here.</p>
        </mat-tab>
        <mat-tab label="AI Feedback">
          <p class="results__placeholder">AI evaluation feedback will appear here.</p>
        </mat-tab>
        <mat-tab label="Metrics">
          <p class="results__placeholder">Communication metrics will appear here.</p>
        </mat-tab>
      </mat-tab-group>

      <div class="results__actions">
        <button mat-stroked-button routerLink="/dashboard">Back to Dashboard</button>
        <button mat-raised-button color="primary" routerLink="/interview">New Session</button>
      </div>
    </section>
  `,
  styles: [`
    .results__subtitle { margin-bottom: 28px; }
    .results__scores { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 28px; }
    .results__score-card { text-align: center; }
    .results__score-label { font-size: var(--il-font-sm); color: var(--il-text-muted); margin-bottom: 8px; }
    .results__score-value { font-size: var(--il-font-3xl); font-weight: 700; color: var(--il-primary-400); margin: 0; }
    .results__tabs { margin-bottom: 28px; }
    .results__placeholder { padding: 24px 0; color: var(--il-text-muted); font-style: italic; }
    .results__actions { display: flex; gap: 12px; justify-content: flex-end; }
  `],
})
export class InterviewResultsPage {}
