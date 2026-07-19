import { Injectable, signal } from '@angular/core';
import { SpeechError } from '../speech.types';

const STOP_TIMEOUT_MS = 500;

/**
 * SpeechRecognitionService
 *
 * Wraps the Web Speech API (SpeechRecognition).
 * - Runs in continuous mode with auto-restart on Chrome's forced stop.
 * - Accumulates finalTranscript across restarts so the transcript is never lost.
 * - interimTranscript reflects unconfirmed words in real-time.
 * - `stop()` is async: waits for native `onend` so no interim words are discarded.
 */
@Injectable({ providedIn: 'root' })
export class SpeechRecognitionService {
  private _recognition: SpeechRecognition | null = null;
  private _accumulatedFinal = '';
  private _stopping = false;
  private _stopResolve: ((transcript: string) => void) | null = null;

  readonly isListening = signal(false);
  readonly interimTranscript = signal('');
  readonly finalTranscript = signal('');
  readonly recognitionError = signal<{ code: string; message: string } | null>(null);

  /** Called when a terminal error (not 'no-speech') occurs while listening. */
  onTerminalError?: (code: string, message: string) => void;

  readonly isSupported: boolean =
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

  start(language: string): void {
    if (!this.isSupported) {
      throw new SpeechError('NOT_SUPPORTED', 'Web Speech API is not supported in this browser');
    }
    if (this.isListening()) return;

    this._accumulatedFinal = '';
    this._stopping = false;
    this._stopResolve = null;
    this.finalTranscript.set('');
    this.interimTranscript.set('');
    this.recognitionError.set(null);

    const SpeechRecognitionImpl = window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognitionImpl) {
      throw new SpeechError('NOT_SUPPORTED', 'Web Speech API is not supported in this browser');
    }

    this._recognition = new SpeechRecognitionImpl();
    this._recognition.continuous = true;
    this._recognition.interimResults = true;
    this._recognition.maxAlternatives = 1;
    this._recognition.lang = language;

    this._recognition.onresult = (event: SpeechRecognitionEvent) => this._handleResult(event);
    this._recognition.onerror = (event: SpeechRecognitionErrorEvent) => this._handleError(event);
    this._recognition.onend = () => {
      if (this._stopping) {
        this._finalizeStop();
        return;
      }
      // Auto-restart on Chrome's forced stop (~60s silence)
      if (this.isListening()) {
        this._recognition?.start();
      }
    };

    this._recognition.start();
    this.isListening.set(true);
  }

  stop(): Promise<string> {
    if (!this.isListening()) return Promise.resolve(this.finalTranscript());
    if (!this._recognition) {
      this.isListening.set(false);
      return Promise.resolve(this.finalTranscript());
    }

    this._stopping = true;

    return new Promise<string>((resolve) => {
      this._stopResolve = resolve;

      this._recognition!.stop();

      setTimeout(() => {
        if (this._stopResolve) {
          this._finalizeStop();
        }
      }, STOP_TIMEOUT_MS);
    });
  }

  reset(): Promise<void> {
    return this.stop().then(() => {
      this._accumulatedFinal = '';
      this.finalTranscript.set('');
      this.interimTranscript.set('');
      this.recognitionError.set(null);
    });
  }

  private _finalizeStop(): void {
    const interim = this.interimTranscript();
    if (interim) {
      this._accumulatedFinal += interim + ' ';
    }

    this._recognition = null;
    this.isListening.set(false);
    this.interimTranscript.set('');
    this._stopping = false;

    const transcript = this._accumulatedFinal.trim();
    this.finalTranscript.set(transcript);

    this._stopResolve?.(transcript);
    this._stopResolve = null;
  }

  private _handleResult(event: SpeechRecognitionEvent): void {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const text = result[0].transcript;
      if (result.isFinal) {
        this._accumulatedFinal += text + ' ';
      } else {
        interim += text;
      }
    }
    this.finalTranscript.set(this._accumulatedFinal.trim());
    this.interimTranscript.set(interim);
  }

  private _handleError(event: SpeechRecognitionErrorEvent): void {
    const code = event.error;
    const message = this._mapError(code);
    this.recognitionError.set({ code, message });

    if (code !== 'no-speech') {
      if (this.isListening()) {
        this.onTerminalError?.(code, message);
      }
      this.isListening.set(false);
      this._recognition = null;
    }
  }

  private _mapError(code: string): string {
    const map: Record<string, string> = {
      'no-speech': 'SPEECH_NO_SPEECH_DETECTED',
      'audio-capture': 'SPEECH_AUDIO_CAPTURE_FAILED',
      'not-allowed': 'SPEECH_MICROPHONE_DENIED',
      network: 'SPEECH_NETWORK_ERROR',
      aborted: 'SPEECH_ABORTED',
      'language-not-supported': 'SPEECH_LANGUAGE_NOT_SUPPORTED',
    };
    return map[code] ?? 'SPEECH_UNKNOWN_ERROR';
  }
}
