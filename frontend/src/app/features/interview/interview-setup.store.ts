import { Injectable, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AsyncStore } from '../../core/store/async.store';
import { InterviewMode, QuestionDifficulty } from '../../core/models/domain.enums';
import { Interview } from '../../core/models/domain.models';
import { InterviewApiService } from '../../core/interview/interview-api.service';
import { ProfileApiService } from '../../core/profile/profile-api.service';
import { CandidateProfile } from '../../core/models/domain.models';

export interface InterviewSetupState extends Record<string, unknown> {
  mode: InterviewMode;
  difficulty: QuestionDifficulty;
  questionCount: number;
  createdInterview: Interview | null;
  profile: CandidateProfile | null;
}

@Injectable({ providedIn: 'root' })
export class InterviewSetupStore extends AsyncStore<InterviewSetupState> {
  private readonly _interviewApi = inject(InterviewApiService);
  private readonly _profileApi = inject(ProfileApiService);

  readonly mode = computed(() => this._state().mode);
  readonly difficulty = computed(() => this._state().difficulty);
  readonly questionCount = computed(() => this._state().questionCount);
  readonly createdInterview = computed(() => this._state().createdInterview);
  readonly profile = computed(() => this._state().profile);

  readonly isCreating = computed(() => this.isLoading('create'));
  readonly createError = computed(() => this.getError('create'));
  readonly isProfileLoading = computed(() => this.isLoading('loadProfile'));
  readonly profileError = computed(() => this.getError('loadProfile'));

  readonly hasProfile = computed(() => this._state().profile !== null);
  readonly profileCompletion = computed(() => this._state().profile?.completionPercent ?? 0);
  readonly isProfileSufficient = computed(() => this.profileCompletion() >= 20);

  readonly canCreate = computed(() =>
    !this.isCreating() &&
    !this.isProfileLoading() &&
    this.hasProfile() &&
    this.isProfileSufficient()
  );

  readonly estimatedMinutes = computed(() => {
    const count = this._state().questionCount;
    const avgMinutesPerQuestion = 2;
    return count * avgMinutesPerQuestion;
  });

  readonly modeLabel = computed(() => {
    const labels: Record<InterviewMode, string> = {
      HR: 'HR & Behavioral',
      TECHNICAL: 'Technical',
      MIXED: 'Mixed',
    };
    return labels[this._state().mode];
  });

  readonly difficultyLabel = computed(() => {
    const labels: Record<QuestionDifficulty, string> = {
      EASY: 'Easy',
      MEDIUM: 'Medium',
      HARD: 'Hard',
    };
    return labels[this._state().difficulty];
  });

  constructor() {
    super({
      mode: InterviewMode.TECHNICAL,
      difficulty: QuestionDifficulty.MEDIUM,
      questionCount: 10,
      createdInterview: null,
      profile: null,
    });
  }

  setMode(mode: InterviewMode): void {
    this._setState({ mode });
  }

  setDifficulty(difficulty: QuestionDifficulty): void {
    this._setState({ difficulty });
  }

  setQuestionCount(count: number): void {
    this._setState({ questionCount: count });
  }

  async loadProfile(): Promise<void> {
    this._startOperation('loadProfile');
    try {
      const res = await firstValueFrom(this._profileApi.getMyProfile());
      this._setState({ profile: res.data });
      this._completeOperation('loadProfile');
    } catch (err: unknown) {
      const message = this._extractError(err);
      this._setState({ profile: null });
      this._failOperation('loadProfile', message);
    }
  }

  async createInterview(): Promise<Interview | null> {
    this._startOperation('create');
    try {
      const res = await firstValueFrom(
        this._interviewApi.createInterview({ mode: this._state().mode })
      );
      this._setState({ createdInterview: res.data });
      this._completeOperation('create');
      return res.data;
    } catch (err: unknown) {
      const message = this._extractError(err);
      this._failOperation('create', message);
      return null;
    }
  }

  private _extractError(err: unknown): string {
    if (typeof err === 'object' && err !== null && 'error' in err) {
      const httpErr = err as { error: { message?: string } };
      return httpErr.error?.message ?? 'An unexpected error occurred';
    }
    return 'An unexpected error occurred';
  }
}
