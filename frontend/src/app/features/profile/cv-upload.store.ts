import { Injectable, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BaseStore } from '../../core/store/base.store';
import { CvAnalysisStatus } from '../../core/models/domain.enums';
import { CvApiService, CvMetadata } from '../../core/cv/cv-api.service';
import { extractErrorMessage } from '../../core/http/error-message';

export interface CvUploadState {
  metadata: CvMetadata | null;
  uploading: boolean;
  loading: boolean;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class CvUploadStore extends BaseStore<CvUploadState> {
  private readonly _api = inject(CvApiService);

  readonly metadata = computed(() => this._state().metadata);
  readonly uploading = computed(() => this._state().uploading);
  readonly hasCv = computed(() => this._state().metadata !== null);
  readonly status = computed(() => this._state().metadata?.analysisStatus ?? ('NOT_UPLOADED' as CvAnalysisStatus));
  readonly isProcessing = computed(() => this.status() === 'PROCESSING' || this.status() === 'PENDING');
  readonly isCompleted = computed(() => this.status() === 'COMPLETED');
  readonly isFailed = computed(() => this.status() === 'FAILED');

  readonly statusLabel = computed(() => {
    const s = this.status();
    const labels: Record<CvAnalysisStatus, string> = {
      NOT_UPLOADED: 'No CV uploaded',
      PENDING: 'Pending analysis',
      PROCESSING: 'Analyzing CV...',
      COMPLETED: 'Analysis complete',
      FAILED: 'Analysis failed',
    };
    return labels[s];
  });

  readonly statusVariant = computed(() => {
    const s = this.status();
    const variants: Record<CvAnalysisStatus, 'neutral' | 'primary' | 'warning' | 'success' | 'danger'> = {
      NOT_UPLOADED: 'neutral',
      PENDING: 'warning',
      PROCESSING: 'warning',
      COMPLETED: 'success',
      FAILED: 'danger',
    };
    return variants[s];
  });

  constructor() {
    super({
      metadata: null,
      uploading: false,
      loading: false,
      error: null,
    });
  }

  async loadMetadata(): Promise<void> {
    this._setLoading(true);
    this._setError(null);
    try {
      const res = await firstValueFrom(this._api.getMetadata());
      this._setState({ metadata: res.data, loading: false });
    } catch (err: unknown) {
      if (this._isNotFound(err)) {
        this._setState({ metadata: null, loading: false });
      } else {
        this._setState({ loading: false, error: extractErrorMessage(err, 'An error occurred') });
      }
    }
  }

  async upload(file: File): Promise<boolean> {
    this._setState({ uploading: true, error: null });
    try {
      const res = await firstValueFrom(this._api.uploadCv(file));
      this._setState({
        uploading: false,
        metadata: {
          fileName: res.data.fileName,
          fileUrl: res.data.fileUrl,
          fileSize: res.data.fileSize,
          uploadedAt: new Date().toISOString(),
          analysisStatus: res.data.status,
        },
      });
      return true;
    } catch (err: unknown) {
      this._setState({ uploading: false, error: extractErrorMessage(err, 'An error occurred') });
      return false;
    }
  }

  async replace(file: File): Promise<boolean> {
    this._setState({ uploading: true, error: null });
    try {
      const res = await firstValueFrom(this._api.replaceCv(file));
      this._setState({
        uploading: false,
        metadata: {
          fileName: res.data.fileName,
          fileUrl: res.data.fileUrl,
          fileSize: res.data.fileSize,
          uploadedAt: new Date().toISOString(),
          analysisStatus: res.data.status,
        },
      });
      return true;
    } catch (err: unknown) {
      this._setState({ uploading: false, error: extractErrorMessage(err, 'An error occurred') });
      return false;
    }
  }

  async deleteCv(): Promise<boolean> {
    this._setLoading(true);
    this._setError(null);
    try {
      await firstValueFrom(this._api.deleteCv());
      this._setState({ metadata: null, loading: false });
      return true;
    } catch (err: unknown) {
      this._setState({ loading: false, error: extractErrorMessage(err, 'An error occurred') });
      return false;
    }
  }

  private _isNotFound(err: unknown): boolean {
    if (typeof err === 'object' && err !== null && 'status' in err) {
      return (err as { status: number }).status === 404;
    }
    return false;
  }

}
