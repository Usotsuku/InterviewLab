import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { IlBadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ProjectEntry } from '../../../../core/models/domain.models';

@Component({
  selector: 'il-project-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, IlBadgeComponent],
  templateUrl: './project-card.component.html',
})
export class IlProjectCardComponent {
  entry = input.required<ProjectEntry>();
  editable = input(false);
  index = input(0);
  removeClicked = output<number>();
}
