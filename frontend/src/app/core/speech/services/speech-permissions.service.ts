import { Injectable, signal } from '@angular/core';
import { SpeechError } from '../speech.types';

/**
 * SpeechPermissionsService
 *
 * Single owner of microphone permission state and MediaStream lifecycle.
 * - Requests getUserMedia once and caches the stream.
 * - Observes permission revocations via the Permissions API.
 * - AudioRecorderService receives the stream from here — it never calls getUserMedia directly.
 */
@Injectable({ providedIn: 'root' })
export class SpeechPermissionsService {
  readonly permissionState = signal<'UNKNOWN' | 'GRANTED' | 'DENIED' | 'PROMPT'>('UNKNOWN');

  private _cachedStream: MediaStream | null = null;
  private _permissionStatus: PermissionStatus | null = null;

  constructor() {
    this._checkExistingPermission();
  }

  async requestPermission(): Promise<'GRANTED' | 'DENIED' | 'UNKNOWN'> {
    this.permissionState.set('PROMPT');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this._cachedStream = stream;
      this.permissionState.set('GRANTED');
      this._observePermissionChanges();
      return 'GRANTED';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        this.permissionState.set('DENIED');
        return 'DENIED';
      }
      this.permissionState.set('UNKNOWN');
      throw new SpeechError('PERMISSION_REQUEST_FAILED', String(err));
    }
  }

  async getStream(): Promise<MediaStream> {
    if (this._cachedStream && this._areTracksActive()) {
      return this._cachedStream;
    }
    await this.requestPermission();
    if (!this._cachedStream) {
      throw new SpeechError('STREAM_UNAVAILABLE', 'Could not obtain audio stream');
    }
    return this._cachedStream;
  }

  private async _checkExistingPermission(): Promise<void> {
    try {
      if (!navigator.permissions) return;
      this._permissionStatus = await navigator.permissions.query({
        name: 'microphone' as PermissionName,
      });
      this.permissionState.set(this._mapState(this._permissionStatus.state));
      this._observePermissionChanges();
    } catch {
      // Permissions API not supported — state remains UNKNOWN
    }
  }

  private _observePermissionChanges(): void {
    if (!this._permissionStatus) return;
    this._permissionStatus.onchange = () => {
      const newState = this._mapState(this._permissionStatus!.state);
      this.permissionState.set(newState);
      if (newState === 'DENIED') {
        this._cachedStream?.getTracks().forEach((t) => t.stop());
        this._cachedStream = null;
      }
    };
  }

  private _mapState(state: string): 'GRANTED' | 'DENIED' | 'PROMPT' | 'UNKNOWN' {
    if (state === 'granted') return 'GRANTED';
    if (state === 'denied') return 'DENIED';
    if (state === 'prompt') return 'PROMPT';
    return 'UNKNOWN';
  }

  private _areTracksActive(): boolean {
    return this._cachedStream?.getTracks().every((t) => t.readyState === 'live') ?? false;
  }
}
