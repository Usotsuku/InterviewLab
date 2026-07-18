import { Injectable, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Theme, THEME_STORAGE_KEY, THEME_DARK, THEME_LIGHT } from './theme.types';

const VALID_THEMES: ReadonlySet<Theme> = new Set<Theme>([THEME_DARK, THEME_LIGHT]);

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _current = signal<Theme>(THEME_DARK);

  readonly theme = this._current.asReadonly();
  readonly isDark = computed(() => this._current() === THEME_DARK);
  readonly isLight = computed(() => this._current() === THEME_LIGHT);

  constructor() {
    if (isPlatformBrowser(this._platformId)) {
      this._applyTheme(this._loadSavedTheme());
    }
  }

  setTheme(theme: Theme): void {
    if (!VALID_THEMES.has(theme)) return;
    if (this._current() === theme) return;
    this._current.set(theme);
    this._saveTheme(theme);
    this._applyTheme(theme);
  }

  toggleTheme(): void {
    this.setTheme(this._current() === THEME_DARK ? THEME_LIGHT : THEME_DARK);
  }

  private _loadSavedTheme(): Theme {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved && VALID_THEMES.has(saved as Theme)) {
        return saved as Theme;
      }
    } catch {
      // localStorage unavailable (SSR / private browsing edge cases)
    }
    return THEME_DARK;
  }

  private _saveTheme(theme: Theme): void {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // localStorage unavailable
    }
  }

  private _applyTheme(theme: Theme): void {
    if (!isPlatformBrowser(this._platformId)) return;
    const root = document.documentElement;
    root.classList.remove(THEME_DARK, THEME_LIGHT);
    root.classList.add(theme === THEME_DARK ? 'il-theme-dark' : 'il-theme-light');
  }
}
