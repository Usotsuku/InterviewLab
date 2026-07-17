import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * AuthLayoutComponent — unauthenticated shell (login/register pages).
 * Clean centered layout without sidebar.
 */
@Component({
  selector: 'il-auth-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `
    <div class="auth-layout">
      <div class="auth-layout__panel">
        <div class="auth-layout__brand">
          <div class="auth-layout__logo">IL</div>
          <h1 class="auth-layout__title">InterviewLab</h1>
          <p class="auth-layout__subtitle">Master your interview with AI-powered feedback</p>
        </div>
        <router-outlet />
      </div>
    </div>
  `,
  styles: [`
    .auth-layout {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--il-bg);
      background-image: radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.08) 0%, transparent 60%),
                        radial-gradient(ellipse at 80% 20%, rgba(16,185,129,0.06) 0%, transparent 50%);
    }
    .auth-layout__panel {
      width: 100%;
      max-width: 440px;
      padding: 0 16px;
    }
    .auth-layout__brand {
      text-align: center;
      margin-bottom: 32px;
    }
    .auth-layout__logo {
      width: 52px;
      height: 52px;
      background: var(--il-primary-500);
      border-radius: var(--il-radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 20px;
      color: white;
      margin: 0 auto 16px;
      box-shadow: var(--il-shadow-glow);
    }
    .auth-layout__title {
      font-size: var(--il-font-2xl);
      font-weight: 700;
      margin-bottom: 8px;
    }
    .auth-layout__subtitle {
      font-size: var(--il-font-sm);
      color: var(--il-text-muted);
      margin: 0;
    }
  `],
})
export class AuthLayoutComponent {}
