import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SpeechFacadeService } from '../../../../core/speech/services/speech-facade.service';

/**
 * InterviewSessionPage — the live interview screen.
 * Integrates with SpeechFacadeService for recording.
 * Business logic implementation deferred to sprint 2.
 */
@Component({
  selector: 'il-interview-session',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule],
  template: `
    <section class="session">
      <!-- Question Panel -->
      <div class="il-card session__question-card">
        <div class="session__question-meta">
          <span class="il-badge il-badge--primary">Question 1 / 10</span>
          <span class="il-badge il-badge--warn">TECHNICAL · MEDIUM</span>
        </div>
        <h2 class="session__question-text">
          <!-- TODO: bind to current question signal -->
          Tell me about a challenging technical problem you solved recently.
        </h2>
        <mat-progress-bar mode="determinate" [value]="10" class="session__progress" />
      </div>

      <!-- Answer Panel -->
      <div class="il-card session__answer-card">
        <!-- Microphone Permission Gate -->
        @if (speech.permissionState() !== 'GRANTED') {
          <div class="session__permission">
            <mat-icon class="session__mic-icon">mic_off</mat-icon>
            <h3>Microphone Access Required</h3>
            <p>InterviewLab needs your microphone to record your answer.</p>
            <button mat-raised-button color="primary" (click)="speech.requestMicrophonePermission()">
              Grant Microphone Access
            </button>
          </div>
        }

        <!-- Transcript Display -->
        @if (speech.permissionState() === 'GRANTED') {
          <div class="session__transcript">
            <p class="session__transcript-label">Your Answer</p>
            <div class="session__transcript-text">
              {{ speech.finalTranscript() }}
              <span class="session__transcript-interim">{{ speech.interimTranscript() }}</span>
              @if (!speech.finalTranscript() && !speech.interimTranscript()) {
                <span class="session__transcript-placeholder">
                  {{ speech.isRecording() ? 'Listening...' : 'Your answer will appear here as you speak.' }}
                </span>
              }
            </div>
          </div>

          <!-- Recording Duration -->
          @if (speech.isRecording()) {
            <div class="session__duration">
              <div class="il-recording-dot"></div>
              <span>{{ speech.recordingDurationSeconds() }}s</span>
            </div>
          }

          <!-- Controls -->
          <div class="session__controls">
            @if (!speech.isRecording()) {
              <button mat-raised-button color="primary" (click)="onStartRecording()">
                <mat-icon>mic</mat-icon>
                Start Recording
              </button>
            } @else {
              <button mat-raised-button color="warn" (click)="onStopRecording()">
                <mat-icon>stop</mat-icon>
                Stop &amp; Submit
              </button>
            }
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    .session { display: flex; flex-direction: column; gap: 20px; max-width: 800px; margin: 0 auto; }
    .session__question-meta { display: flex; gap: 10px; margin-bottom: 16px; }
    .session__question-text { font-size: var(--il-font-xl); line-height: 1.5; color: var(--il-text); }
    .session__progress { margin-top: 20px; border-radius: 4px; }
    .session__permission { text-align: center; padding: 24px 0; }
    .session__mic-icon { font-size: 48px; width: 48px; height: 48px; color: var(--il-text-muted); margin-bottom: 16px; }
    .session__transcript-label { font-size: var(--il-font-xs); text-transform: uppercase; letter-spacing: .05em; color: var(--il-text-muted); margin-bottom: 10px; }
    .session__transcript-text { min-height: 100px; font-size: var(--il-font-base); line-height: 1.7; color: var(--il-text); }
    .session__transcript-interim { color: var(--il-text-muted); }
    .session__transcript-placeholder { color: var(--il-surface-3); font-style: italic; }
    .session__duration { display: flex; align-items: center; gap: 8px; font-size: var(--il-font-sm); color: #ef4444; margin: 12px 0; }
    .session__controls { display: flex; justify-content: center; margin-top: 20px; }
  `],
})
export class InterviewSessionPage implements OnDestroy {
  readonly speech = inject(SpeechFacadeService);

  onStartRecording(): void {
    this.speech.startAnswering('en-US');
  }

  async onStopRecording(): Promise<void> {
    const result = await this.speech.stopAnswering();
    // TODO: submit result via AnswerApiService then load next question
    console.log('Answer recorded:', result);
  }

  ngOnDestroy(): void {
    this.speech.destroy();
  }
}
