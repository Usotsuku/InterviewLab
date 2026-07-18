import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

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
export class SidebarComponent {
  collapsed = input(false);
  toggleCollapse = output<void>();

  readonly navItems: NavItem[] = [
    { label: 'Dashboard',  icon: 'dashboard',         route: '/dashboard' },
    { label: 'Interview',  icon: 'record_voice_over',  route: '/interview' },
    { label: 'Profile',    icon: 'person',             route: '/profile' },
    { label: 'Analytics',  icon: 'bar_chart',          route: '/analytics' },
    { label: 'History',    icon: 'history',            route: '/history' },
    { label: 'Settings',   icon: 'settings',           route: '/settings' },
  ];

  sidebarClass = computed(() =>
    this.collapsed() ? 'il-sidebar il-sidebar--collapsed' : 'il-sidebar',
  );
}
