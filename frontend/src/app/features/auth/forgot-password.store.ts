import { Injectable, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ApiResponse } from '../../core/http/api-response.interface';
import { BaseStore } from '../../core/store/base.store';

export interface ForgotPasswordState {
  emailSent: boolean;
  sentToEmail: string;
  loading: boolean;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class ForgotPasswordStore extends BaseStore<ForgotPasswordState> {
  readonly emailSent = computed(() => this._state().emailSent);
  readonly sentToEmail = computed(() => this._state().sentToEmail);

  private readonly _http = inject(HttpClient);

  constructor() {
    super({
      emailSent: false,
      sentToEmail: '',
      loading: false,
      error: null,
    });
  }

  async sendResetEmail(email: string): Promise<boolean> {
    this._setLoading(true);
    this._setError(null);
    try {
      await firstValueFrom(
        this._http.post<ApiResponse<{ message: string }>>('auth/forgot-password', { email }),
      );
      this._setState({ emailSent: true, sentToEmail: email, loading: false });
      return true;
    } catch (err: unknown) {
      this._setState({ loading: false, error: this._extractError(err) });
      return false;
    }
  }

  resetForm(): void {
    this._setState({ emailSent: false, sentToEmail: '', error: null });
  }

  private _extractError(err: unknown): string {
    if (err instanceof Object && 'error' in err) {
      const httpErr = err as { error: { message?: string } };
      return httpErr.error?.message ?? 'Failed to send reset email. Please try again.';
    }
    return 'Failed to send reset email. Please try again.';
  }
}
