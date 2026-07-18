import { Injectable, computed } from '@angular/core';
import { BaseStore } from '../../core/store/base.store';

export interface SettingsHomeState {
  language: string;
  notificationsEnabled: boolean;
  interviewReminders: boolean;
  loading: boolean;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class SettingsHomeStore extends BaseStore<SettingsHomeState> {
  readonly language = computed(() => this._state().language);
  readonly notificationsEnabled = computed(() => this._state().notificationsEnabled);
  readonly interviewReminders = computed(() => this._state().interviewReminders);

  constructor() {
    super({
      language: 'en',
      notificationsEnabled: true,
      interviewReminders: true,
      loading: false,
      error: null,
    });
  }

  setLanguage(language: string): void {
    this._setState({ language });
  }

  toggleNotifications(): void {
    this._setState({ notificationsEnabled: !this._state().notificationsEnabled });
  }

  toggleReminders(): void {
    this._setState({ interviewReminders: !this._state().interviewReminders });
  }
}
