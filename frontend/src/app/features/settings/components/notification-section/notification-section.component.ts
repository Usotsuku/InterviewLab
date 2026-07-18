import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { IlCardComponent } from '@shared/components/card/card.component';

@Component({
  selector: 'il-notification-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, MatIconModule, IlCardComponent],
  templateUrl: './notification-section.component.html',
})
export class IlNotificationSectionComponent {
  notificationsEnabled = input(true);
  interviewReminders = input(true);

  notificationsChange = output<boolean>();
  remindersChange = output<boolean>();

  onToggleNotifications(): void {
    this.notificationsChange.emit(!this.notificationsEnabled());
  }

  onToggleReminders(): void {
    this.remindersChange.emit(!this.interviewReminders());
  }
}
