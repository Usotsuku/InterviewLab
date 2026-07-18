import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../http/api-response.interface';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _http = inject(HttpClient);

  login(payload: LoginPayload): Observable<ApiResponse<{ user: AuthUser } & AuthTokens>> {
    return this._http.post<ApiResponse<{ user: AuthUser } & AuthTokens>>('auth/login', payload);
  }

  register(payload: RegisterPayload): Observable<ApiResponse<{ user: AuthUser } & AuthTokens>> {
    return this._http.post<ApiResponse<{ user: AuthUser } & AuthTokens>>('auth/register', payload);
  }

  refreshToken(refreshToken: string): Observable<ApiResponse<AuthTokens>> {
    return this._http.post<ApiResponse<AuthTokens>>('auth/refresh', { refreshToken });
  }

  logout(refreshToken: string): Observable<ApiResponse<{ message: string }>> {
    return this._http.post<ApiResponse<{ message: string }>>('auth/logout', { refreshToken });
  }

  getCurrentUser(): Observable<ApiResponse<AuthUser>> {
    return this._http.get<ApiResponse<AuthUser>>('auth/me');
  }
}
