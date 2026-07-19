import { Injectable, signal, computed } from '@angular/core';
import { AudioRecorderService } from './audio-recorder.service';
import { SpeechRecognitionService } from './speech-recognition.service';
import { TranscriptValidationService } from './transcript-validation.service';
import { SpeechPermissionsService } from './speech-permissions.service';
import { SpeechError, SpeechResult, SpeechState } from '../speech.types';

/**
 * SpeechFacadeService — the ONLY speech service injected by feature components.
 *
 * Coordinates: AudioRecorderService, SpeechRecognitionService,
 * TranscriptValidationService, SpeechPermissionsService.
 *
 * Components MUST NOT inject sub-services directly.
 * This facade enforces the single-entry-point architectural rule.
 */
@Injectable({ providedIn: 'root' })
export class SpeechFacadeService {
  private readonly _speechState = signal<SpeechState>('IDLE');
  private readonly _error = signal<SpeechError | null>(null);
  private _currentStream: MediaStream | null = null;
  private _lastAudioBlob: Blob = new Blob();

  /** Public read-only state signals */
  readonly speechState = this._speechState.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isRecording = computed(() => this._speechState() === 'RECORDING');
  readonly hasError = computed(() => this._speechState() === 'ERROR');
  readonly interimTranscript = computed(() => this._recognition.interimTranscript());
  readonly finalTranscript = computed(() => this._recognition.finalTranscript());
  readonly permissionState = computed(() => this._permissions.permissionState());
  readonly recordingDurationSeconds = computed(() =>
    Math.floor(this._recorder.durationMs() / 1000),
  );

  constructor(
    private readonly _recorder: AudioRecorderService,
    private readonly _recognition: SpeechRecognitionService,
    private readonly _validator: TranscriptValidationService,
    private readonly _permissions: SpeechPermissionsService,
  ) {
    this._recognition.onTerminalError = (code: string, message: string) => {
      if (this._speechState() === 'RECORDING') {
        this._speechState.set('ERROR');
        this._error.set(new SpeechError('RECOGNITION_ERROR', `[${code}] ${message}`));
      }
    };
  }

  async requestMicrophonePermission(): Promise<void> {
    this._speechState.set('REQUESTING_PERMISSION');
    const state = await this._permissions.requestPermission();
    if (state === 'GRANTED') {
      this._speechState.set('READY');
      this._error.set(null);
    } else {
      this._speechState.set('ERROR');
      this._error.set(new SpeechError('PERMISSION_DENIED', 'Microphone access was denied'));
    }
  }

  async startAnswering(language: string): Promise<void> {
    if (this._speechState() === 'RECORDING') return;

    if (this._permissions.permissionState() !== 'GRANTED') {
      await this.requestMicrophonePermission();
      if (this._permissions.permissionState() !== 'GRANTED') return;
    }

    try {
      this._currentStream = await this._permissions.getStream();
      await this._recorder.start(this._currentStream);
      this._recognition.start(language);
      this._speechState.set('RECORDING');
      this._error.set(null);
    } catch (err) {
      this._speechState.set('ERROR');
      this._error.set(
        err instanceof SpeechError
          ? err
          : new SpeechError('START_FAILED', String(err)),
      );
    }
  }

  async stopAnswering(): Promise<SpeechResult> {
    if (this._speechState() !== 'RECORDING') {
      throw new SpeechError('NOT_RECORDING', 'Cannot stop — not currently recording');
    }

    this._speechState.set('PROCESSING');

    const durationSeconds = this.recordingDurationSeconds();
    const transcript = await this._recognition.stop();

    const validation = this._validator.validate(transcript, durationSeconds);

    try {
      this._lastAudioBlob = await this._recorder.stop();
    } catch {
      this._lastAudioBlob = new Blob();
    }

    if (!validation.isValid) {
      this._speechState.set('ERROR');
      this._error.set(
        new SpeechError(validation.errors[0], `Validation failed: ${validation.errors.join(', ')}`),
      );
    } else {
      this._speechState.set('COMPLETED');
    }

    return {
      transcript,
      audioBlob: this._lastAudioBlob,
      durationSeconds,
      wordCount: validation.wordCount,
    };
  }

  getAnalyserNode(): AnalyserNode | null {
    if (!this._currentStream) return null;
    return this._recorder.getAnalyserNode(this._currentStream);
  }

  async resetForNextQuestion(): Promise<void> {
    await this._recognition.reset();
    this._error.set(null);
    this._speechState.set('READY');
  }

  async destroy(): Promise<void> {
    await this._recognition.stop();
    this._currentStream?.getTracks().forEach((t) => t.stop());
    this._currentStream = null;
    this._speechState.set('IDLE');
  }
}
