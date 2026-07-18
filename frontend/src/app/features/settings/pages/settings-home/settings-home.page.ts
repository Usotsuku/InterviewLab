import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SettingsStore } from '../../settings.store';
import { AuthStore } from '@core/auth/auth.store';
import { IlSpinnerComponent } from '@shared/components/spinner/spinner.component';
import { IlButtonComponent } from '@shared/components/button/button.component';
import {
  IlAccountSectionComponent,
  IlAppearanceSectionComponent,
  IlPasswordSectionComponent,
  IlNotificationSectionComponent,
  IlDeviceSectionComponent,
  IlAboutSectionComponent,
  IlDeleteAccountSectionComponent,
} from '../../components';

@Component({
  selector: 'il-settings-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IlSpinnerComponent,
    IlButtonComponent,
    IlAccountSectionComponent,
    IlAppearanceSectionComponent,
    IlPasswordSectionComponent,
    IlNotificationSectionComponent,
    IlDeviceSectionComponent,
    IlAboutSectionComponent,
    IlDeleteAccountSectionComponent,
  ],
  templateUrl: './settings-home.page.html',
})
export class SettingsHomePage {
  private readonly _settingsStore = inject(SettingsStore);
  private readonly _authStore = inject(AuthStore);
  private readonly _router = inject(Router);

  readonly store = this._settingsStore;

  onThemeChange(theme: 'dark' | 'light'): void {
    this._settingsStore.setTheme(theme);
  }

  onLanguageChange(lang: 'en' | 'fr' | 'ar' | 'es' | 'de'): void {
    this._settingsStore.setLanguage(lang);
  }

  onNotificationsChange(enabled: boolean): void {
    this._settingsStore.setNotificationsEnabled(enabled);
  }

  onRemindersChange(enabled: boolean): void {
    this._settingsStore.setInterviewReminders(enabled);
  }

  onMicChange(enabled: boolean): void {
    this._settingsStore.setMicEnabled(enabled);
  }

  onAutoTranscribeChange(enabled: boolean): void {
    this._settingsStore.setAutoTranscribe(enabled);
  }

  async onPasswordChange(payload: { currentPassword: string; newPassword: string }): Promise<void> {
    await this._settingsStore.changePassword(payload.currentPassword, payload.newPassword);
  }

  async onDeleteAccount(): Promise<void> {
    const success = await this._settingsStore.deleteAccount();
    if (success) {
      this._router.navigate(['/auth/login']);
    }
  }

  async onLogout(): Promise<void> {
    await this._authStore.logout();
    this._router.navigate(['/auth/login']);
  }
}
