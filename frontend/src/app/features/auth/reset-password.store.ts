import { Injectable, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ApiResponse } from '../../core/http/api-response.interface';
import { BaseStore } from '../../core/store/base.store';
import { extractErrorMessage } from '../../core/http/error-message';

export interface ResetPasswordState {
  resetComplete: boolean;
  loading: boolean;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class ResetPasswordStore extends BaseStore<ResetPasswordState> {
  readonly resetComplete = computed(() => this._state().resetComplete);

  private readonly _http = inject(HttpClient);

  constructor() {
    super({
      resetComplete: false,
      loading: false,
      error: null,
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    this._setLoading(true);
    this._setError(null);
    try {
      await firstValueFrom(
        this._http.post<ApiResponse<{ message: string }>>('auth/reset-password', {
          token,
          password: newPassword,
        }),
      );
      this._setState({ resetComplete: true, loading: false });
      return true;
    } catch (err: unknown) {
      this._setState({ loading: false, error: extractErrorMessage(err, 'Failed to reset password. The link may have expired.') });
      return false;
    }
  }

}
