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
  template: `
    <section class="settings">
      <h1>Settings</h1>
      <p>Manage your application preferences.</p>

      <div class="il-card settings__section">
        <h3>Language &amp; Region</h3>
        <mat-form-field appearance="outline">
          <mat-label>Language</mat-label>
          <mat-select [(ngModel)]="language" name="language">
            <mat-option value="en">English</mat-option>
            <mat-option value="fr">Français</mat-option>
            <mat-option value="ar">العربية</mat-option>
            <mat-option value="es">Español</mat-option>
            <mat-option value="de">Deutsch</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="il-card settings__section">
        <h3>Notifications</h3>
        <div class="settings__toggle-row">
          <span>Enable Notifications</span>
          <mat-slide-toggle [(ngModel)]="notificationsEnabled" />
        </div>
        <div class="settings__toggle-row">
          <span>Interview Reminders</span>
          <mat-slide-toggle [(ngModel)]="interviewReminders" />
        </div>
      </div>

      <div class="settings__actions">
        <button mat-raised-button color="primary" (click)="onSave()">Save Settings</button>
      </div>
    </section>
  `,
  styles: [`
    .settings__section { margin-bottom: 20px; max-width: 520px; }
    .settings__section h3 { margin-bottom: 16px; }
    .settings__toggle-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--il-border); }
    .settings__actions { margin-top: 8px; }
  `],
})
export class SettingsHomePage {
  language = 'en';
  notificationsEnabled = true;
  interviewReminders = true;

  onSave(): void {
    // TODO: dispatch to SettingsApiService
    console.log('Settings saved');
  }
}
