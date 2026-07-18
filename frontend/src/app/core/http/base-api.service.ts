import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse, PaginatedApiResponse } from '../http/api-response.interface';

/**
 * BaseApiService<T> — abstract CRUD service for all feature API services.
 * Provides type-safe HTTP methods that consume the ApiResponse envelope.
 *
 * Usage:
 * @Injectable({ providedIn: 'root' })
 * export class InterviewApiService extends BaseApiService<Interview> {
 *   protected override readonly path = 'interviews';
 * }
 */
export abstract class BaseApiService<T> {
  protected abstract readonly path: string;

  protected readonly _http = inject(HttpClient);

  protected get _baseUrl(): string {
    return this.path;
  }

  findAll(params?: HttpParams): Observable<PaginatedApiResponse<T>> {
    return this._http.get<PaginatedApiResponse<T>>(this._baseUrl, { params });
  }

  findById(id: string): Observable<ApiResponse<T>> {
    return this._http.get<ApiResponse<T>>(`${this._baseUrl}/${id}`);
  }

  create(body: unknown): Observable<ApiResponse<T>> {
    return this._http.post<ApiResponse<T>>(this._baseUrl, body);
  }

  update(id: string, body: unknown): Observable<ApiResponse<T>> {
    return this._http.patch<ApiResponse<T>>(`${this._baseUrl}/${id}`, body);
  }

  replace(id: string, body: unknown): Observable<ApiResponse<T>> {
    return this._http.put<ApiResponse<T>>(`${this._baseUrl}/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this._http.delete<void>(`${this._baseUrl}/${id}`);
  }
}
