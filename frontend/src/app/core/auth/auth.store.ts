import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { TokenService } from './token.service';
import { ApiResponse } from '../http/api-response.interface';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * AuthStore — signal-based, unidirectional auth state container.
 * Only this store calls AuthApiService for session operations.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly _state = signal<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  });

  readonly user = computed(() => this._state().user);
  readonly isAuthenticated = computed(() => this._state().isAuthenticated);
  readonly loading = computed(() => this._state().loading);
  readonly error = computed(() => this._state().error);

  constructor(
    private readonly _http: HttpClient,
    private readonly _tokenService: TokenService,
  ) {
    this._restoreSession();
  }

  async login(email: string, password: string): Promise<void> {
    this._setState({ loading: true, error: null });
    try {
      const res = await firstValueFrom(
        this._http.post<ApiResponse<{ accessToken: string; refreshToken: string; user: AuthUser }>>(
          '/auth/login',
          { email, password },
        ),
      );
      this._tokenService.setTokens(res.data.accessToken, res.data.refreshToken);
      this._setState({ user: res.data.user, isAuthenticated: true, loading: false });
    } catch (err: any) {
      this._setState({ error: err?.error?.message ?? 'Login failed', loading: false });
    }
  }

  async register(name: string, email: string, password: string): Promise<void> {
    this._setState({ loading: true, error: null });
    try {
      const res = await firstValueFrom(
        this._http.post<ApiResponse<{ accessToken: string; refreshToken: string; user: AuthUser }>>(
          '/auth/register',
          { name, email, password },
        ),
      );
      this._tokenService.setTokens(res.data.accessToken, res.data.refreshToken);
      this._setState({ user: res.data.user, isAuthenticated: true, loading: false });
    } catch (err: any) {
      this._setState({ error: err?.error?.message ?? 'Registration failed', loading: false });
    }
  }

  logout(): void {
    this._tokenService.clearTokens();
    this._setState({ user: null, isAuthenticated: false, error: null });
  }

  private _restoreSession(): void {
    if (this._tokenService.hasValidToken()) {
      // TODO: fetch /users/me to restore user from token
      this._setState({ isAuthenticated: true });
    }
  }

  private _setState(partial: Partial<AuthState>): void {
    this._state.update((s) => ({ ...s, ...partial }));
  }
}
