import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { IlCardComponent } from '@shared/components/card/card.component';
import { IlButtonComponent } from '@shared/components/button/button.component';
import { Theme } from '@core/theme/theme.types';

@Component({
  selector: 'il-appearance-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, MatIconModule, IlCardComponent, IlButtonComponent],
  templateUrl: './appearance-section.component.html',
})
export class IlAppearanceSectionComponent {
  theme = input<Theme>('dark');
  language = input<'en' | 'fr' | 'ar' | 'es' | 'de'>('en');

  themeChange = output<Theme>();
  languageChange = output<'en' | 'fr' | 'ar' | 'es' | 'de'>();

  themes: { value: Theme; label: string; icon: string }[] = [
    { value: 'dark', label: 'Dark', icon: 'dark_mode' },
    { value: 'light', label: 'Light', icon: 'light_mode' },
  ];

  languages: { value: string; label: string }[] = [
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Francais' },
    { value: 'ar', label: 'العربية' },
    { value: 'es', label: 'Espanol' },
    { value: 'de', label: 'Deutsch' },
  ];

  onThemeSelect(t: Theme): void {
    this.themeChange.emit(t);
  }

  onLanguageChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.languageChange.emit(target.value as 'en' | 'fr' | 'ar' | 'es' | 'de');
  }
}
