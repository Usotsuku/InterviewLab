import { Injectable, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService, AuthUser } from './auth.service';
import { TokenService } from './token.service';
import { BaseStore } from '../store/base.store';

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthStore extends BaseStore<AuthState> {
  readonly user = computed(() => this._state().user);
  readonly isAuthenticated = computed(() => this._state().isAuthenticated);
  readonly initialized = computed(() => this._state().initialized);

  private readonly _authService = inject(AuthService);
  private readonly _tokenService = inject(TokenService);

  constructor() {
    super({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      initialized: false,
    });
    this._restoreSession();
  }

  async login(email: string, password: string): Promise<boolean> {
    this._setLoading(true);
    this._setError(null);
    try {
      const res = await firstValueFrom(
        this._authService.login({ email, password }),
      );
      this._tokenService.setTokens(res.data.accessToken, res.data.refreshToken);
      this._setState({
        user: res.data.user,
        isAuthenticated: true,
        loading: false,
        initialized: true,
      });
      return true;
    } catch (err: unknown) {
      this._setState({ loading: false, error: this._extractError(err, 'Login failed') });
      return false;
    }
  }

  async register(name: string, email: string, password: string): Promise<boolean> {
    this._setLoading(true);
    this._setError(null);
    try {
      const res = await firstValueFrom(
        this._authService.register({ name, email, password }),
      );
      this._tokenService.setTokens(res.data.accessToken, res.data.refreshToken);
      this._setState({
        user: res.data.user,
        isAuthenticated: true,
        loading: false,
        initialized: true,
      });
      return true;
    } catch (err: unknown) {
      this._setState({ loading: false, error: this._extractError(err, 'Registration failed') });
      return false;
    }
  }

  async logout(): Promise<void> {
    const refreshToken = this._tokenService.getRefreshToken();
    try {
      if (refreshToken) {
        await firstValueFrom(this._authService.logout(refreshToken));
      }
    } catch {
      // Logout server call failed — proceed with local cleanup regardless
    }
    this._tokenService.clearTokens();
    this._setState({ user: null, isAuthenticated: false, error: null });
  }

  async loadCurrentUser(): Promise<void> {
    if (!this._tokenService.hasValidToken()) {
      this._setState({ initialized: true });
      return;
    }
    try {
      const res = await firstValueFrom(this._authService.getCurrentUser());
      this._setState({ user: res.data, isAuthenticated: true, initialized: true });
    } catch {
      this._tokenService.clearTokens();
      this._setState({ user: null, isAuthenticated: false, initialized: true });
    }
  }

  private async _restoreSession(): Promise<void> {
    if (this._tokenService.hasValidToken()) {
      this._setState({ isAuthenticated: true });
      await this.loadCurrentUser();
    } else {
      this._setState({ initialized: true });
    }
  }

  private _extractError(err: unknown, fallback: string): string {
    if (err instanceof Object && 'error' in err) {
      const httpErr = err as { error: { message?: string } };
      return httpErr.error?.message ?? fallback;
    }
    return fallback;
  }
}
