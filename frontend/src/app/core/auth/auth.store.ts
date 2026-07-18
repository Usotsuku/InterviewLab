import { Injectable, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { TokenService } from './token.service';
import { ApiResponse } from '../http/api-response.interface';
import { BaseStore } from '../store/base.store';

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

@Injectable({ providedIn: 'root' })
export class AuthStore extends BaseStore<AuthState> {
  readonly user = computed(() => this._state().user);
  readonly isAuthenticated = computed(() => this._state().isAuthenticated);

  constructor(
    private readonly _http: HttpClient,
    private readonly _tokenService: TokenService,
  ) {
    super({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
    this._restoreSession();
  }

  async login(email: string, password: string): Promise<void> {
    this._setLoading(true);
    this._setError(null);
    try {
      const res = await firstValueFrom(
        this._http.post<ApiResponse<{ accessToken: string; refreshToken: string; user: AuthUser }>>(
          '/auth/login',
          { email, password },
        ),
      );
      this._tokenService.setTokens(res.data.accessToken, res.data.refreshToken);
      this._setState({ user: res.data.user, isAuthenticated: true, loading: false });
    } catch (err: unknown) {
      const message = err instanceof Object && 'error' in err
        ? (err as { error: { message?: string } }).error?.message ?? 'Login failed'
        : 'Login failed';
      this._setState({ loading: false, error: message });
    }
  }

  async register(name: string, email: string, password: string): Promise<void> {
    this._setLoading(true);
    this._setError(null);
    try {
      const res = await firstValueFrom(
        this._http.post<ApiResponse<{ accessToken: string; refreshToken: string; user: AuthUser }>>(
          '/auth/register',
          { name, email, password },
        ),
      );
      this._tokenService.setTokens(res.data.accessToken, res.data.refreshToken);
      this._setState({ user: res.data.user, isAuthenticated: true, loading: false });
    } catch (err: unknown) {
      const message = err instanceof Object && 'error' in err
        ? (err as { error: { message?: string } }).error?.message ?? 'Registration failed'
        : 'Registration failed';
      this._setState({ loading: false, error: message });
    }
  }

  logout(): void {
    this._tokenService.clearTokens();
    this._setState({ user: null, isAuthenticated: false, error: null });
  }

  private _restoreSession(): void {
    if (this._tokenService.hasValidToken()) {
      this._setState({ isAuthenticated: true });
    }
  }
}
