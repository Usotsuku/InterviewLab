import { Injectable, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AsyncStore } from '../../core/store/async.store';
import { InterviewApiService, SubmitAnswerResponse } from '../../core/interview/interview-api.service';
import { Interview, Question } from '../../core/models/domain.models';
import { InterviewStatus } from '../../core/models/domain.enums';

export interface InterviewSessionState extends Record<string, unknown> {
  interview: Interview | null;
  currentQuestion: Question | null;
  questions: Question[];
  currentQuestionIndex: number;
  totalQuestions: number;
  completed: boolean;
  lastSubmitResult: SubmitAnswerResponse | null;
}

@Injectable({ providedIn: 'root' })
export class InterviewSessionStore extends AsyncStore<InterviewSessionState> {
  private readonly _api = inject(InterviewApiService);

  readonly interview = computed(() => this._state().interview);
  readonly currentQuestion = computed(() => this._state().currentQuestion);
  readonly questions = computed(() => this._state().questions);
  readonly currentQuestionIndex = computed(() => this._state().currentQuestionIndex);
  readonly totalQuestions = computed(() => this._state().totalQuestions);
  readonly completed = computed(() => this._state().completed);
  readonly lastSubmitResult = computed(() => this._state().lastSubmitResult);

  readonly isLoadingInterview = computed(() => this.isLoading('loadInterview'));
  readonly interviewError = computed(() => this.getError('loadInterview'));
  readonly isStarting = computed(() => this.isLoading('start'));
  readonly startError = computed(() => this.getError('start'));
  readonly isSubmitting = computed(() => this.isLoading('submit'));
  readonly submitError = computed(() => this.getError('submit'));
  readonly isFinishing = computed(() => this.isLoading('finish'));
  readonly finishError = computed(() => this.getError('finish'));

  readonly progressPercent = computed(() => {
    const total = this._state().totalQuestions;
    if (total === 0) return 0;
    return Math.round((this._state().currentQuestionIndex / total) * 100);
  });

  readonly questionNumber = computed(() => this._state().currentQuestionIndex + 1);

  readonly isInterviewActive = computed(() => {
    const status = this._state().interview?.status;
    return status === InterviewStatus.IN_PROGRESS;
  });

  readonly canRecord = computed(() => this._state().currentQuestion !== null && !this._state().completed);

  constructor() {
    super({
      interview: null,
      currentQuestion: null,
      questions: [],
      currentQuestionIndex: 0,
      totalQuestions: 0,
      completed: false,
      lastSubmitResult: null,
    });
  }

  async loadInterview(id: string): Promise<void> {
    this._startOperation('loadInterview');
    try {
      const res = await firstValueFrom(this._api.getInterview(id));
      this._setState({
        interview: res.data,
        totalQuestions: res.data.totalQuestions,
        currentQuestionIndex: res.data.currentQuestionIndex,
      });
      this._completeOperation('loadInterview');
    } catch (err: unknown) {
      this._failOperation('loadInterview', this._extractError(err));
    }
  }

  async startInterview(id: string): Promise<boolean> {
    this._startOperation('start');
    try {
      const res = await firstValueFrom(this._api.startInterview(id));
      this._setState({
        interview: {
          ...this._state().interview!,
          status: InterviewStatus.IN_PROGRESS,
          startedAt: res.data.startedAt,
        },
        currentQuestionIndex: 0,
      });
      this._completeOperation('start');
      return true;
    } catch (err: unknown) {
      this._failOperation('start', this._extractError(err));
      return false;
    }
  }

  async loadCurrentQuestion(id: string): Promise<void> {
    try {
      const res = await firstValueFrom(this._api.getCurrentQuestion(id));
      this._setState({
        currentQuestion: res.data.question,
        currentQuestionIndex: res.data.currentQuestionIndex,
        totalQuestions: res.data.totalQuestions,
      });
    } catch {
      this._setState({ currentQuestion: null });
    }
  }

  async loadAllQuestions(id: string): Promise<void> {
    try {
      const res = await firstValueFrom(this._api.getQuestions(id));
      this._setState({ questions: res.data });
    } catch {
      this._setState({ questions: [] });
    }
  }

  async submitAnswer(
    interviewId: string,
    questionId: string,
    transcript: string,
    durationSeconds: number,
  ): Promise<boolean> {
    this._startOperation('submit');
    try {
      const res = await firstValueFrom(
        this._api.submitAnswer(interviewId, {
          questionId,
          transcript,
          durationSeconds,
        }),
      );
      this._setState({ lastSubmitResult: res.data });
      this._completeOperation('submit');

      await this.loadCurrentQuestion(interviewId);

      if (this._state().currentQuestion === null) {
        this._setState({ completed: true });
      }

      return true;
    } catch (err: unknown) {
      this._failOperation('submit', this._extractError(err));
      return false;
    }
  }

  async finishInterview(id: string): Promise<boolean> {
    this._startOperation('finish');
    try {
      const res = await firstValueFrom(this._api.finishInterview(id));
      this._setState({
        interview: {
          ...this._state().interview!,
          status: InterviewStatus.COMPLETED,
          completedAt: res.data.completedAt,
        },
        completed: true,
        currentQuestion: null,
      });
      this._completeOperation('finish');
      return true;
    } catch (err: unknown) {
      this._failOperation('finish', this._extractError(err));
      return false;
    }
  }

  reset(): void {
    this._setState({
      interview: null,
      currentQuestion: null,
      questions: [],
      currentQuestionIndex: 0,
      totalQuestions: 0,
      completed: false,
      lastSubmitResult: null,
    });
    this.clearAllOperations();
  }

  private _extractError(err: unknown): string {
    if (typeof err === 'object' && err !== null && 'error' in err) {
      const httpErr = err as { error: { message?: string } };
      return httpErr.error?.message ?? 'An unexpected error occurred';
    }
    return 'An unexpected error occurred';
  }
}
