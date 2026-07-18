import { Component, ChangeDetectionStrategy, inject, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { SpeechFacadeService } from '../../../../core/speech/services/speech-facade.service';
import { InterviewSessionStore } from '../../interview-session.store';
import { IlInterviewProgressComponent } from '../../components/interview-progress/interview-progress.component';
import { IlQuestionCardComponent } from '../../components/question-card/question-card.component';
import { IlRecordingIndicatorComponent } from '../../components/recording-indicator/recording-indicator.component';
import { IlTimerDisplayComponent } from '../../components/timer-display/timer-display.component';
import { IlTranscriptPanelComponent } from '../../components/transcript-panel/transcript-panel.component';
import { IlSessionControlsComponent } from '../../components/session-controls/session-controls.component';
import { IlSpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { IlButtonComponent } from '../../../../shared/components/button/button.component';


@Component({
  selector: 'il-interview-session',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule,
    IlInterviewProgressComponent,
    IlQuestionCardComponent,
    IlRecordingIndicatorComponent,
    IlTimerDisplayComponent,
    IlTranscriptPanelComponent,
    IlSessionControlsComponent,
    IlSpinnerComponent,
    IlButtonComponent,
  ],
  templateUrl: './interview-session.page.html',
})
export class InterviewSessionPage implements OnInit, OnDestroy {
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _speech = inject(SpeechFacadeService);
  private readonly _store = inject(InterviewSessionStore);

  private readonly _interviewId = signal<string>('');
  private readonly _elapsedSeconds = signal(0);
  private _timerInterval: ReturnType<typeof setInterval> | null = null;

  readonly store = this._store;
  readonly speech = this._speech;

  readonly modeLabel = computed(() => {
    const labels: Record<string, string> = {
      HR: 'HR & Behavioral',
      TECHNICAL: 'Technical',
      MIXED: 'Mixed',
    };
    const interview = this._store.interview();
    return interview ? labels[interview.mode] ?? interview.mode : '';
  });

  readonly hasContent = computed(() => {
    return !!(this._speech.finalTranscript() || this._speech.interimTranscript());
  });

  readonly elapsedSeconds = this._elapsedSeconds.asReadonly();

  readonly showLoading = computed(() =>
    this._store.isLoadingInterview() || (this._store.isStarting() && !this._store.interview())
  );

  readonly showError = computed(() =>
    this._store.interviewError() || this._store.startError()
  );

  ngOnInit(): void {
    const id = this._route.snapshot.paramMap.get('id') ?? '';
    this._interviewId.set(id);
    this._initSession(id);
  }

  ngOnDestroy(): void {
    this._speech.destroy();
    this._stopTimer();
    this._store.reset();
  }

  async onStartRecording(): Promise<void> {
    await this._speech.startAnswering('en-US');
    this._startTimer();
  }

  async onStopRecording(): Promise<void> {
    this._stopTimer();
    const result = await this._speech.stopAnswering();

    const question = this._store.currentQuestion();
    if (!question) return;

    const id = this._interviewId();
    await this._store.submitAnswer(id, question.id, result.transcript, result.durationSeconds);

    this._elapsedSeconds.set(0);
    this._speech.resetForNextQuestion();
  }

  async onRequestPermission(): Promise<void> {
    await this._speech.requestMicrophonePermission();
  }

  async onFinishEarly(): Promise<void> {
    const id = this._interviewId();
    const success = await this._store.finishInterview(id);
    if (success) {
      this._router.navigate(['/interview', id, 'results']);
    }
  }

  async onFinishAfterComplete(): Promise<void> {
    const id = this._interviewId();
    await this._store.finishInterview(id);
    this._router.navigate(['/interview', id, 'results']);
  }

  onRetry(): void {
    const id = this._interviewId();
    this._store.reset();
    this._initSession(id);
  }

  private async _initSession(id: string): Promise<void> {
    await this._store.loadInterview(id);
    const interview = this._store.interview();
    if (!interview) return;

    if (interview.status === 'READY') {
      const started = await this._store.startInterview(id);
      if (!started) return;
    }

    if (interview.status === 'COMPLETED') {
      this._router.navigate(['/interview', id, 'results']);
      return;
    }

    await Promise.all([
      this._store.loadCurrentQuestion(id),
      this._store.loadAllQuestions(id),
    ]);
  }

  private _startTimer(): void {
    this._stopTimer();
    this._elapsedSeconds.set(0);
    this._timerInterval = setInterval(() => {
      this._elapsedSeconds.update((s) => s + 1);
    }, 1000);
  }

  private _stopTimer(): void {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  }
}
