import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SpeechFacadeService } from '../../../../core/speech/services/speech-facade.service';

@Component({
  selector: 'il-interview-session',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule],
  templateUrl: './interview-session.page.html',
})
export class InterviewSessionPage implements OnDestroy {
  readonly speech = inject(SpeechFacadeService);

  onStartRecording(): void {
    this.speech.startAnswering('en-US');
  }

  async onStopRecording(): Promise<void> {
    const result = await this.speech.stopAnswering();
    console.log('Answer recorded:', result);
  }

  ngOnDestroy(): void {
    this.speech.destroy();
  }
}
