import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'il-weaknesses-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  templateUrl: './weaknesses-card.component.html',
})
export class IlWeaknessesCardComponent {
  weaknesses = input<string[]>([]);
}
