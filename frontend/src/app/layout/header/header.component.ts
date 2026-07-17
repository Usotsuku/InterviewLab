import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AuthStore } from '../../core/auth/auth.store';

/**
 * HeaderComponent — top navigation bar for authenticated layout.
 */
@Component({
  selector: 'il-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatButtonModule, MatMenuModule],
  template: `
    <header class="header">
      <div class="header__left">
        <h6 class="header__title">InterviewLab</h6>
      </div>
      <div class="header__right">
        <!-- Notifications -->
        <button mat-icon-button aria-label="Notifications">
          <mat-icon>notifications_none</mat-icon>
        </button>

        <!-- User Menu -->
        <button mat-icon-button [matMenuTriggerFor]="userMenu" aria-label="User menu">
          <mat-icon>account_circle</mat-icon>
        </button>
        <mat-menu #userMenu="matMenu">
          <button mat-menu-item (click)="onLogout()">
            <mat-icon>logout</mat-icon>
            <span>Logout</span>
          </button>
        </mat-menu>
      </div>
    </header>
  `,
  styles: [`
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 32px;
      height: 60px;
      background: var(--il-surface-1);
      border-bottom: 1px solid var(--il-border);
    }
    .header__title {
      font-size: var(--il-font-base);
      font-weight: 600;
      color: var(--il-text-muted);
    }
    .header__right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `],
})
export class HeaderComponent {
  private readonly _authStore = inject(AuthStore);
  private readonly _router = inject(Router);

  onLogout(): void {
    this._authStore.logout();
    this._router.navigate(['/auth/login']);
  }
}
