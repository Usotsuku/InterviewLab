import { Injectable, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService, AuthUser } from './auth.service';
import { TokenService } from './token.service';
import { BaseStore } from '../store/base.store';
import { extractErrorMessage } from '../http/error-message';

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

  private _resolveInit!: () => void;
  private readonly _initPromise: Promise<void>;

  constructor() {
    super({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      initialized: false,
    });
    this._initPromise = new Promise((resolve) => {
      this._resolveInit = resolve;
    });
    this._restoreSession();
  }

  waitForInitialization(): Promise<void> {
    return this.initialized() ? Promise.resolve() : this._initPromise;
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
      this._resolveInit();
      return true;
    } catch (err: unknown) {
      this._setState({ loading: false, error: extractErrorMessage(err, 'Login failed') });
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
      this._resolveInit();
      return true;
    } catch (err: unknown) {
      this._setState({ loading: false, error: extractErrorMessage(err, 'Registration failed') });
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
    this._setState({ user: null, isAuthenticated: false, error: null, initialized: true });
    this._resolveInit();
  }

  async loadCurrentUser(): Promise<void> {
    if (!this._tokenService.hasValidToken()) {
      this._setState({ initialized: true });
      this._resolveInit();
      return;
    }
    try {
      const res = await firstValueFrom(this._authService.getCurrentUser());
      this._setState({ user: res.data, isAuthenticated: true, initialized: true });
    } catch {
      this._tokenService.clearTokens();
      this._setState({ user: null, isAuthenticated: false, initialized: true });
    }
    this._resolveInit();
  }

  private async _restoreSession(): Promise<void> {
    if (this._tokenService.hasValidToken()) {
      this._setState({ isAuthenticated: true });
      await this.loadCurrentUser();
    } else {
      this._setState({ initialized: true });
      this._resolveInit();
    }
  }

}
