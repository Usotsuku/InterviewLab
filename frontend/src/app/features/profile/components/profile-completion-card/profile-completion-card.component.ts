import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'il-profile-completion-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  templateUrl: './profile-completion-card.component.html',
})
export class IlProfileCompletionCardComponent {
  percent = input(0);
  hasSummary = input(false);
  hasSkills = input(false);
  hasTechnologies = input(false);
  hasExperience = input(false);
  hasProjects = input(false);
}
