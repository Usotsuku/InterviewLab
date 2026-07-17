import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

/**
 * SidebarComponent — persistent navigation panel for authenticated layout.
 */
@Component({
  selector: 'il-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <aside class="sidebar">
      <!-- Brand -->
      <div class="sidebar__brand">
        <span class="sidebar__logo">IL</span>
        <span class="sidebar__brand-name">InterviewLab</span>
      </div>

      <!-- Navigation -->
      <nav class="sidebar__nav">
        @for (item of navItems; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="sidebar__link--active"
            class="sidebar__link"
            [attr.aria-label]="item.label"
          >
            <mat-icon class="sidebar__link-icon">{{ item.icon }}</mat-icon>
            <span class="sidebar__link-label">{{ item.label }}</span>
          </a>
        }
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar {
      height: 100vh;
      background: var(--il-surface-1);
      border-right: 1px solid var(--il-border);
      display: flex;
      flex-direction: column;
      padding: 0;
    }
    .sidebar__brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 20px 16px;
      border-bottom: 1px solid var(--il-border);
    }
    .sidebar__logo {
      width: 36px;
      height: 36px;
      background: var(--il-primary-500);
      border-radius: var(--il-radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      color: white;
    }
    .sidebar__brand-name {
      font-weight: 700;
      font-size: var(--il-font-base);
      color: var(--il-text);
    }
    .sidebar__nav {
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .sidebar__link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: var(--il-radius-sm);
      color: var(--il-text-muted);
      font-size: var(--il-font-sm);
      font-weight: 500;
      transition: all var(--il-transition-base);
      text-decoration: none;
    }
    .sidebar__link:hover {
      background: rgba(99,102,241,0.08);
      color: var(--il-primary-300);
    }
    .sidebar__link--active {
      background: rgba(99,102,241,0.15) !important;
      color: var(--il-primary-400) !important;
    }
    .sidebar__link-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
  `],
})
export class SidebarComponent {
  readonly navItems: NavItem[] = [
    { label: 'Dashboard',  icon: 'dashboard',       route: '/dashboard' },
    { label: 'Interview',  icon: 'record_voice_over', route: '/interview' },
    { label: 'Profile',    icon: 'person',           route: '/profile' },
    { label: 'Analytics',  icon: 'bar_chart',        route: '/analytics' },
    { label: 'History',    icon: 'history',          route: '/history' },
    { label: 'Settings',   icon: 'settings',         route: '/settings' },
  ];
}
