import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ExperienceEntry } from '../../../../core/models/domain.models';

@Component({
  selector: 'il-experience-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, DatePipe],
  templateUrl: './experience-card.component.html',
})
export class IlExperienceCardComponent {
  entry = input.required<ExperienceEntry>();
  editable = input(false);
  index = input(0);
  removeClicked = output<number>();
}
