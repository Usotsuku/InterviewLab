import { Injectable, computed } from '@angular/core';
import { BaseStore } from '../../core/store/base.store';
import { InterviewMode, QuestionDifficulty } from '../../core/models/domain.enums';

export interface InterviewSetupState {
  mode: InterviewMode;
  difficulty: QuestionDifficulty;
  questionCount: number;
  loading: boolean;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class InterviewSetupStore extends BaseStore<InterviewSetupState> {
  readonly mode = computed(() => this._state().mode);
  readonly difficulty = computed(() => this._state().difficulty);
  readonly questionCount = computed(() => this._state().questionCount);

  constructor() {
    super({
      mode: 'TECHNICAL' as InterviewMode,
      difficulty: 'MEDIUM' as QuestionDifficulty,
      questionCount: 10,
      loading: false,
      error: null,
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
}
