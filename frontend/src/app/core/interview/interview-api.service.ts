import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../http/api-response.interface';
import { BaseApiService } from '../http/base-api.service';
import { Interview, Question, InterviewReport } from '../models/domain.models';
import { InterviewMode } from '../models/domain.enums';

export interface CreateInterviewDto {
  mode: InterviewMode;
  questionCount?: number;
}

export interface CurrentQuestionResponse {
  interviewId: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  question: Question | null;
}

export interface NextQuestionResponse {
  question: Question | null;
  completed: boolean;
}

export interface SubmitAnswerDto {
  questionId: string;
  transcript?: string;
  durationSeconds?: number;
  audioBlob?: string;
}

export interface SubmitAnswerResponse {
  success: boolean;
  audioUrl: string;
  metrics: Record<string, unknown> | null;
  evaluation: Record<string, unknown> | null;
}

@Injectable({ providedIn: 'root' })
export class InterviewApiService extends BaseApiService<Interview> {
  protected override readonly path = 'interviews';

  createInterview(dto: CreateInterviewDto): Observable<ApiResponse<Interview>> {
    return this._http.post<ApiResponse<Interview>>(this._baseUrl, dto);
  }

  getInterviews(): Observable<ApiResponse<Interview[]>> {
    return this._http.get<ApiResponse<Interview[]>>(this._baseUrl);
  }

  getInterview(id: string): Observable<ApiResponse<Interview>> {
    return this._http.get<ApiResponse<Interview>>(`${this._baseUrl}/${id}`);
  }

  startInterview(id: string): Observable<ApiResponse<Interview>> {
    return this._http.get<ApiResponse<Interview>>(`${this._baseUrl}/${id}/start`);
  }

  getCurrentQuestion(id: string): Observable<ApiResponse<CurrentQuestionResponse>> {
    return this._http.get<ApiResponse<CurrentQuestionResponse>>(`${this._baseUrl}/${id}/current-question`);
  }

  nextQuestion(id: string): Observable<ApiResponse<NextQuestionResponse>> {
    return this._http.post<ApiResponse<NextQuestionResponse>>(`${this._baseUrl}/${id}/next`, {});
  }

  finishInterview(id: string): Observable<ApiResponse<Interview>> {
    return this._http.post<ApiResponse<Interview>>(`${this._baseUrl}/${id}/finish`, {});
  }

  getQuestions(id: string): Observable<ApiResponse<Question[]>> {
    return this._http.get<ApiResponse<Question[]>>(`${this._baseUrl}/${id}/questions`);
  }

  submitAnswer(id: string, dto: SubmitAnswerDto): Observable<ApiResponse<SubmitAnswerResponse>> {
    return this._http.post<ApiResponse<SubmitAnswerResponse>>(`${this._baseUrl}/${id}/answers`, dto);
  }

  deleteInterview(id: string): Observable<void> {
    return this._http.delete<void>(`${this._baseUrl}/${id}`);
  }

  getReport(id: string): Observable<ApiResponse<InterviewReport>> {
    return this._http.get<ApiResponse<InterviewReport>>(`${this._baseUrl}/${id}/report`);
  }
}
