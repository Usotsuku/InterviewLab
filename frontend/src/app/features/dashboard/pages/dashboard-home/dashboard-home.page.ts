import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { DashboardStore } from '../../dashboard.store';

@Component({
  selector: 'il-dashboard-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, RouterLink],
  templateUrl: './dashboard-home.page.html',
})
export class DashboardHomePage {
  readonly store = inject(DashboardStore);
}
