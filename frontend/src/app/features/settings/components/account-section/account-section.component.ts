import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { IlCardComponent } from '@shared/components/card/card.component';

@Component({
  selector: 'il-account-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatIconModule, IlCardComponent],
  templateUrl: './account-section.component.html',
})
export class IlAccountSectionComponent {
  userName = input('');
  userEmail = input('');
  userId = input('');
  createdAt = input('');
}
