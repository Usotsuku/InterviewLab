import { Injectable, signal } from '@angular/core';
import { SpeechError } from '../speech.types';

/**
 * SpeechRecognitionService
 *
 * Wraps the Web Speech API (SpeechRecognition).
 * - Runs in continuous mode with auto-restart on Chrome's forced stop.
 * - Accumulates finalTranscript across restarts so the transcript is never lost.
 * - interimTranscript reflects unconfirmed words in real-time.
 */
@Injectable({ providedIn: 'root' })
export class SpeechRecognitionService {
  private _recognition: SpeechRecognition | null = null;
  private _accumulatedFinal = '';

  readonly isListening = signal(false);
  readonly interimTranscript = signal('');
  readonly finalTranscript = signal('');
  readonly recognitionError = signal<{ code: string; message: string } | null>(null);

  readonly isSupported: boolean =
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

  start(language: string): void {
    if (!this.isSupported) {
      throw new SpeechError('NOT_SUPPORTED', 'Web Speech API is not supported in this browser');
    }
    if (this.isListening()) return;

    this._accumulatedFinal = '';
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
      // Auto-restart if still in listening mode (Chrome stops after ~60s silence)
      if (this.isListening()) {
        this._recognition?.start();
      }
    };

    this._recognition.start();
    this.isListening.set(true);
  }

  stop(): string {
    if (!this.isListening()) return this.finalTranscript();
    this._recognition?.stop();
    this._recognition = null;
    this.isListening.set(false);
    this.interimTranscript.set('');
    return this.finalTranscript();
  }

  reset(): void {
    this.stop();
    this._accumulatedFinal = '';
    this.finalTranscript.set('');
    this.interimTranscript.set('');
    this.recognitionError.set(null);
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
    this.recognitionError.set({ code, message: this._mapError(code) });
    // 'no-speech' is non-terminal — keep listening
    if (code !== 'no-speech') {
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
