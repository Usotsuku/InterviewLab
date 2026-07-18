import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { IlCardComponent } from '@shared/components/card/card.component';

@Component({
  selector: 'il-about-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, IlCardComponent],
  templateUrl: './about-section.component.html',
})
export class IlAboutSectionComponent {
  readonly appVersion = '1.0.0';
  readonly aiProvider = 'Google Gemini';
  readonly buildDate = 'July 2026';

  readonly features = [
    { label: 'AI-Powered Interviews', description: 'Gemini-based question generation and evaluation' },
    { label: 'Speech Recognition', description: 'Real-time transcription via Whisper API' },
    { label: 'Performance Analytics', description: 'Metrics, trends, and improvement insights' },
    { label: 'CV Analysis', description: 'AI-powered CV parsing and profile building' },
  ];
}
