import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthStore } from '../../../../core/auth/auth.store';

@Component({
  selector: 'il-login-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="il-card">
      <h2 class="login__title">Welcome back</h2>
      <p class="login__subtitle">Sign in to continue your interview preparation</p>

      @if (authStore.error()) {
        <div class="login__error">{{ authStore.error() }}</div>
      }

      <form class="login__form" (ngSubmit)="onLogin()">
        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput type="email" [(ngModel)]="email" name="email" required autocomplete="email" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Password</mat-label>
          <input matInput type="password" [(ngModel)]="password" name="password" required autocomplete="current-password" />
        </mat-form-field>

        <button
          mat-raised-button
          color="primary"
          type="submit"
          class="login__btn"
          [disabled]="authStore.loading()"
        >
          @if (authStore.loading()) {
            <mat-progress-spinner diameter="20" mode="indeterminate" />
          } @else {
            Sign In
          }
        </button>
      </form>

      <p class="login__footer">
        Don't have an account?
        <a routerLink="/auth/register">Create one</a>
      </p>
    </div>
  `,
  styles: [`
    .login__title { font-size: var(--il-font-xl); margin-bottom: 6px; }
    .login__subtitle { font-size: var(--il-font-sm); margin-bottom: 24px; }
    .login__error {
      background: rgba(239,68,68,0.12);
      color: #f87171;
      padding: 10px 14px;
      border-radius: var(--il-radius-sm);
      font-size: var(--il-font-sm);
      margin-bottom: 16px;
    }
    .login__form { display: flex; flex-direction: column; gap: 4px; }
    .login__btn { width: 100%; height: 44px; margin-top: 8px; }
    .login__footer { text-align: center; font-size: var(--il-font-sm); margin-top: 20px; }
  `],
})
export class LoginPage {
  readonly authStore = inject(AuthStore);
  private readonly _router = inject(Router);

  email = '';
  password = '';

  async onLogin(): Promise<void> {
    await this.authStore.login(this.email, this.password);
    if (this.authStore.isAuthenticated()) {
      this._router.navigate(['/dashboard']);
    }
  }
}
