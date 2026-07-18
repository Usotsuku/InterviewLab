import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../http/api-response.interface';
import { BaseApiService } from '../http/base-api.service';
import { CandidateProfile } from '../models/domain.models';

export interface UpdateProfileDto {
  summary?: string;
  skills?: string[];
  technologies?: string[];
  strengths?: string[];
  weaknesses?: string[];
}

@Injectable({ providedIn: 'root' })
export class ProfileApiService extends BaseApiService<CandidateProfile> {
  protected override readonly path = 'candidate-profile';

  getMyProfile(): Observable<ApiResponse<CandidateProfile>> {
    return this._http.get<ApiResponse<CandidateProfile>>(this._baseUrl);
  }

  updateMyProfile(dto: UpdateProfileDto): Observable<ApiResponse<CandidateProfile>> {
    return this._http.patch<ApiResponse<CandidateProfile>>(this._baseUrl, dto);
  }

  deleteMyProfile(): Observable<ApiResponse<{ deleted: true }>> {
    return this._http.delete<ApiResponse<{ deleted: true }>>(this._baseUrl);
  }
}
