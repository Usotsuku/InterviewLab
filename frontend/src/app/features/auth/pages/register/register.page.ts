import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthStore } from '../../../../core/auth/auth.store';

@Component({
  selector: 'il-register-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="il-card">
      <h2>Create your account</h2>
      <p class="reg__subtitle">Start your AI-powered interview journey</p>

      @if (authStore.error()) {
        <div class="reg__error">{{ authStore.error() }}</div>
      }

      <form class="reg__form" (ngSubmit)="onRegister()">
        <mat-form-field appearance="outline">
          <mat-label>Full Name</mat-label>
          <input matInput [(ngModel)]="name" name="name" required autocomplete="name" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput type="email" [(ngModel)]="email" name="email" required />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Password</mat-label>
          <input matInput type="password" [(ngModel)]="password" name="password" required />
        </mat-form-field>
        <button mat-raised-button color="primary" type="submit" class="reg__btn" [disabled]="authStore.loading()">
          @if (authStore.loading()) {
            <mat-progress-spinner diameter="20" mode="indeterminate" />
          } @else {
            Create Account
          }
        </button>
      </form>

      <p class="reg__footer">Already have an account? <a routerLink="/auth/login">Sign in</a></p>
    </div>
  `,
  styles: [`
    .reg__subtitle { font-size: var(--il-font-sm); margin-bottom: 24px; }
    .reg__error { background: rgba(239,68,68,0.12); color: #f87171; padding: 10px 14px; border-radius: var(--il-radius-sm); font-size: var(--il-font-sm); margin-bottom: 16px; }
    .reg__form { display: flex; flex-direction: column; gap: 4px; }
    .reg__btn { width: 100%; height: 44px; margin-top: 8px; }
    .reg__footer { text-align: center; font-size: var(--il-font-sm); margin-top: 20px; }
  `],
})
export class RegisterPage {
  readonly authStore = inject(AuthStore);
  private readonly _router = inject(Router);
  name = ''; email = ''; password = '';

  async onRegister(): Promise<void> {
    await this.authStore.register(this.name, this.email, this.password);
    if (this.authStore.isAuthenticated()) this._router.navigate(['/dashboard']);
  }
}
