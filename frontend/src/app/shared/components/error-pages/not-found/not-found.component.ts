import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'il-not-found',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule],
  template: `
    <div class="not-found">
      <div class="not-found__content">
        <h1 class="not-found__code">404</h1>
        <h2 class="not-found__title">Page Not Found</h2>
        <p class="not-found__desc">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button mat-raised-button color="primary" routerLink="/dashboard">
          Back to Dashboard
        </button>
      </div>
    </div>
  `,
  styles: [`
    .not-found {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--il-bg);
    }
    .not-found__content {
      text-align: center;
      max-width: 400px;
      padding: 0 24px;
    }
    .not-found__code {
      font-size: 96px;
      font-weight: 800;
      background: linear-gradient(135deg, var(--il-primary-400), var(--il-accent-400));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
      margin-bottom: 16px;
    }
    .not-found__title {
      font-size: var(--il-font-2xl);
      margin-bottom: 12px;
    }
    .not-found__desc {
      margin-bottom: 28px;
    }
  `],
})
export class NotFoundComponent {}
