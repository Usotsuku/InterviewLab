import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'il-settings-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatSlideToggleModule],
  templateUrl: './settings-home.page.html',
})
export class SettingsHomePage {
  language = 'en';
  notificationsEnabled = true;
  interviewReminders = true;

  onSave(): void {
    console.log('Settings saved');
  }
}
