import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { IlButtonComponent } from '@shared/components/button/button.component';

@Component({
  selector: 'il-dashboard-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, IlButtonComponent],
  templateUrl: './dashboard-hero.component.html',
})
export class IlDashboardHeroComponent {
  userName = input('Candidate');
  totalInterviews = input(0);
  completionRate = input(0);
}
