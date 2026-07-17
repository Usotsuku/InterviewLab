import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';

/**
 * MainLayoutComponent — shell for all authenticated routes.
 * Renders the sidebar and top header, then routes into the main content area.
 */
@Component({
  selector: 'il-main-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="il-layout">
      <il-sidebar class="il-layout__sidebar" />
      <div class="il-layout__body">
        <il-header class="il-layout__header" />
        <main class="il-layout__main il-fade-in">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .il-layout {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }
    .il-layout__sidebar {
      width: 260px;
      flex-shrink: 0;
    }
    .il-layout__body {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .il-layout__header {
      flex-shrink: 0;
    }
    .il-layout__main {
      flex: 1;
      overflow-y: auto;
      padding: 24px 32px;
    }
  `],
})
export class MainLayoutComponent {}
