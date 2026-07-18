import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../http/api-response.interface';
import { CvAnalysisStatus } from '../models/domain.enums';
import { BaseApiService } from '../http/base-api.service';

export interface CvMetadata {
  cvFileUrl: string | null;
  cvFileName: string | null;
  cvFileSize: number | null;
  cvUploadedAt: string | null;
  cvAnalysisStatus: CvAnalysisStatus;
}

export interface UploadCvResponse {
  message: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  status: CvAnalysisStatus;
}

@Injectable({ providedIn: 'root' })
export class CvApiService extends BaseApiService<CvMetadata> {
  protected override readonly path = 'cv';

  uploadCv(file: File): Observable<ApiResponse<UploadCvResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    return this._http.post<ApiResponse<UploadCvResponse>>(`${this._baseUrl}/upload`, formData);
  }

  replaceCv(file: File): Observable<ApiResponse<UploadCvResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    return this._http.put<ApiResponse<UploadCvResponse>>(`${this._baseUrl}/upload`, formData);
  }

  getMetadata(): Observable<ApiResponse<CvMetadata>> {
    return this._http.get<ApiResponse<CvMetadata>>(`${this._baseUrl}/metadata`);
  }

  getStatus(): Observable<ApiResponse<{ status: CvAnalysisStatus }>> {
    return this._http.get<ApiResponse<{ status: CvAnalysisStatus }>>(`${this._baseUrl}/status`);
  }

  deleteCv(): Observable<ApiResponse<{ deleted: true }>> {
    return this._http.delete<ApiResponse<{ deleted: true }>>(this._baseUrl);
  }
}
