import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { IlButtonComponent } from '../button/button.component';

@Component({
  selector: 'il-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, IlButtonComponent],
  templateUrl: './empty-state.component.html',
})
export class IlEmptyStateComponent {
  icon = input('inbox');
  title = input('No data');
  description = input<string>();
  actionLabel = input<string>();
  secondaryActionLabel = input<string>();

  actionClick = output<void>();
  secondaryActionClick = output<void>();
}
