import { Injectable, computed } from '@angular/core';
import { EntityStore } from '../../core/store/entity.store';
import { CandidateProfile } from '../../core/models/domain.models';

export interface ProfileEditDraft {
  name: string;
  summary: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileEditStore extends EntityStore<ProfileEditDraft> {
  readonly draftName = computed(() => this.entity()?.name ?? '');
  readonly draftSummary = computed(() => this.entity()?.summary ?? '');
  readonly saving = computed(() => this.loading());

  setDraftName(name: string): void {
    const current = this.entity();
    this._setEntity({ ...current, name });
  }

  setDraftSummary(summary: string): void {
    const current = this.entity();
    this._setEntity({ ...current, summary });
  }
}
