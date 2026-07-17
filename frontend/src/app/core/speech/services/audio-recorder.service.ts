import { Injectable, signal } from '@angular/core';
import { SpeechError } from '../speech.types';

/**
 * AudioRecorderService
 *
 * Wraps the MediaRecorder API.
 * - Receives a MediaStream from SpeechPermissionsService (never calls getUserMedia itself).
 * - Produces a Blob on stop.
 * - Exposes an AnalyserNode for waveform visualization.
 */
@Injectable({ providedIn: 'root' })
export class AudioRecorderService {
  private _mediaRecorder: MediaRecorder | null = null;
  private _chunks: Blob[] = [];
  private _startTime = 0;
  private _durationTimer: ReturnType<typeof setInterval> | null = null;
  private _audioContext: AudioContext | null = null;

  readonly isRecording = signal(false);
  readonly durationMs = signal(0);

  async start(stream: MediaStream): Promise<void> {
    if (this.isRecording()) {
      throw new SpeechError('ALREADY_RECORDING', 'Recording is already in progress');
    }

    this._chunks = [];
    this._startTime = Date.now();

    const mimeType = this._selectMimeType();
    this._mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    this._mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) this._chunks.push(event.data);
    };

    this._mediaRecorder.onerror = () => {
      this.isRecording.set(false);
      throw new SpeechError('RECORDER_ERROR', 'MediaRecorder encountered an error');
    };

    this._mediaRecorder.start(250);
    this.isRecording.set(true);

    this._durationTimer = setInterval(() => {
      this.durationMs.set(Date.now() - this._startTime);
    }, 100);
  }

  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this._mediaRecorder || !this.isRecording()) {
        reject(new SpeechError('NOT_RECORDING', 'No recording in progress'));
        return;
      }

      this._mediaRecorder.onstop = () => {
        const mimeType = this._mediaRecorder?.mimeType ?? 'audio/webm';
        const blob = new Blob(this._chunks, { type: mimeType });
        this._cleanup();
        resolve(blob);
      };

      this._mediaRecorder.stop();
      this.isRecording.set(false);

      if (this._durationTimer !== null) {
        clearInterval(this._durationTimer);
        this._durationTimer = null;
      }
    });
  }

  getAnalyserNode(stream: MediaStream): AnalyserNode | null {
    try {
      this._audioContext = new AudioContext();
      const source = this._audioContext.createMediaStreamSource(stream);
      const analyser = this._audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      return analyser;
    } catch {
      return null;
    }
  }

  private _selectMimeType(): string {
    const preferred = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/mp4'];
    return preferred.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
  }

  private _cleanup(): void {
    this._chunks = [];
    this._mediaRecorder = null;
    this._audioContext?.close();
    this._audioContext = null;
    this.durationMs.set(0);
  }
}
