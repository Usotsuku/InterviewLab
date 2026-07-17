import { Injectable } from '@angular/core';

const ACCESS_TOKEN_KEY = 'il_access_token';
const REFRESH_TOKEN_KEY = 'il_refresh_token';

/**
 * TokenService — single owner of JWT storage.
 * Only this service may read/write tokens.
 * No other service accesses localStorage for tokens.
 */
@Injectable({ providedIn: 'root' })
export class TokenService {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  hasValidToken(): boolean {
    return !!this.getAccessToken();
  }
}
