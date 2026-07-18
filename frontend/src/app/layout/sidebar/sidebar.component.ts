import { Component, ChangeDetectionStrategy, input, output, computed, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ProfileViewStore } from '../../features/profile/profile-view.store';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'il-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  collapsed = input(false);
  toggleCollapse = output<void>();

  private readonly _profile = inject(ProfileViewStore);

  ngOnInit(): void {
    this._profile.load();
  }

  readonly navItems: NavItem[] = [
    { label: 'Dashboard',  icon: 'dashboard',         route: '/dashboard' },
    { label: 'Interview',  icon: 'record_voice_over',  route: '/interview' },
    { label: 'Profile',    icon: 'person',             route: '/profile' },
    { label: 'Analytics',  icon: 'bar_chart',          route: '/analytics' },
    { label: 'History',    icon: 'history',            route: '/history' },
    { label: 'Settings',   icon: 'settings',           route: '/settings' },
  ];

  readonly lockedRoutes = computed(() => {
    const locked = new Set<string>();
    if (!this._profile.isProfileSufficient()) {
      locked.add('/interview');
    }
    return locked;
  });

  isLocked(route: string): boolean {
    return this.lockedRoutes().has(route);
  }

  sidebarClass = computed(() =>
    this.collapsed() ? 'il-sidebar il-sidebar--collapsed' : 'il-sidebar',
  );
}
