import { Component, ChangeDetectionStrategy, signal, inject, HostBinding } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { routeFadeAnimation } from './route-animations';

@Component({
  selector: 'il-main-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  templateUrl: './main-layout.component.html',
  animations: [routeFadeAnimation],
})
export class MainLayoutComponent {
  sidebarCollapsed = signal(false);
  private readonly _router = inject(Router);

  @HostBinding('@routeAnimation') get routeAnimation(): string {
    return this._router.url;
  }
}
