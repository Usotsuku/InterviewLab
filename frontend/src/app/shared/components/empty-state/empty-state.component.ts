import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'il-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  templateUrl: './empty-state.component.html',
})
export class IlEmptyStateComponent {
  icon = input('inbox');
  title = input('No data');
  description = input<string>();
  actionLabel = input<string>();

  actionClick = output<void>();
}
