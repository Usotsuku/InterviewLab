import { Injectable, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AsyncStore } from '../../core/store/async.store';
import { ThemeService } from '../../core/theme/theme.service';
import { Theme } from '../../core/theme/theme.types';
import { AuthStore } from '../../core/auth/auth.store';
import { AuthService } from '../../core/auth/auth.service';
import { ProfileApiService } from '../../core/profile/profile-api.service';
import { NotificationService } from '../../core/notification/notification.service';
import { extractErrorMessage } from '../../core/http/error-message';

export interface SettingsState {
  [key: string]: unknown;
  language: 'en' | 'fr' | 'ar' | 'es' | 'de';
  notificationsEnabled: boolean;
  interviewReminders: boolean;
  micEnabled: boolean;
  autoTranscribe: boolean;
}

const SETTINGS_KEY = 'il_settings';

@Injectable({ providedIn: 'root' })
export class SettingsStore extends AsyncStore<SettingsState> {
  private readonly _themeService = inject(ThemeService);
  private readonly _authStore = inject(AuthStore);
  private readonly _authService = inject(AuthService);
  private readonly _profileService = inject(ProfileApiService);
  private readonly _notifications = inject(NotificationService);

  readonly language = computed(() => this._state().language);
  readonly notificationsEnabled = computed(() => this._state().notificationsEnabled);
  readonly interviewReminders = computed(() => this._state().interviewReminders);
  readonly micEnabled = computed(() => this._state().micEnabled);
  readonly autoTranscribe = computed(() => this._state().autoTranscribe);
  readonly theme = this._themeService.theme;
  readonly isDark = this._themeService.isDark;
  readonly userName = computed(() => this._authStore.user()?.name ?? '');
  readonly userEmail = computed(() => this._authStore.user()?.email ?? '');
  readonly userId = computed(() => this._authStore.user()?.id ?? '');
  readonly userCreatedAt = computed(() => this._authStore.user()?.createdAt ?? '');
  readonly isSaving = computed(() => this.isLoading('save'));
  readonly isChangingPassword = computed(() => this.isLoading('password'));
  readonly isDeleting = computed(() => this.isLoading('delete'));

  constructor() {
    super({
      language: 'en',
      notificationsEnabled: true,
      interviewReminders: true,
      micEnabled: true,
      autoTranscribe: true,
    });
    this._loadLocal();
  }

  setTheme(theme: Theme): void {
    this._themeService.setTheme(theme);
  }

  toggleTheme(): void {
    this._themeService.toggleTheme();
  }

  setLanguage(language: 'en' | 'fr' | 'ar' | 'es' | 'de'): void {
    this._setState({ language });
    this._saveLocal();
  }

  setNotificationsEnabled(enabled: boolean): void {
    this._setState({ notificationsEnabled: enabled });
    this._saveLocal();
  }

  setInterviewReminders(enabled: boolean): void {
    this._setState({ interviewReminders: enabled });
    this._saveLocal();
  }

  setMicEnabled(enabled: boolean): void {
    this._setState({ micEnabled: enabled });
    this._saveLocal();
  }

  setAutoTranscribe(enabled: boolean): void {
    this._setState({ autoTranscribe: enabled });
    this._saveLocal();
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    this._startOperation('password');
    try {
      await firstValueFrom(this._authService.changePassword(currentPassword, newPassword));
      this._completeOperation('password');
      this._notifications.showSuccess('Password changed successfully');
      return true;
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'Failed to change password');
      this._failOperation('password', msg);
      this._notifications.showError(msg);
      return false;
    }
  }

  async deleteAccount(): Promise<boolean> {
    this._startOperation('delete');
    try {
      await firstValueFrom(this._profileService.deleteMyProfile());
      await this._authStore.logout();
      this._completeOperation('delete');
      return true;
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'Failed to delete account');
      this._failOperation('delete', msg);
      this._notifications.showError(msg);
      return false;
    }
  }

  private _loadLocal(): void {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SettingsState>;
        this._setState({
          language: parsed.language ?? 'en',
          notificationsEnabled: parsed.notificationsEnabled ?? true,
          interviewReminders: parsed.interviewReminders ?? true,
          micEnabled: parsed.micEnabled ?? true,
          autoTranscribe: parsed.autoTranscribe ?? true,
        });
      }
    } catch {
      // localStorage unavailable
    }
  }

  private _saveLocal(): void {
    try {
      const state = this._state();
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({
        language: state.language,
        notificationsEnabled: state.notificationsEnabled,
        interviewReminders: state.interviewReminders,
        micEnabled: state.micEnabled,
        autoTranscribe: state.autoTranscribe,
      }));
    } catch {
      // localStorage unavailable
    }
  }

}
