import { Injectable, computed } from '@angular/core';
import { EntityStore } from '../../core/store/entity.store';
import { CandidateProfile } from '../../core/models/domain.models';

@Injectable({ providedIn: 'root' })
export class ProfileViewStore extends EntityStore<CandidateProfile> {
  readonly summary = computed(() => this.entity()?.summary ?? null);
  readonly skills = computed(() => this.entity()?.skills ?? []);
  readonly experience = computed(() => this.entity()?.experience ?? []);

  get hasCv(): boolean {
    return this.entity()?.cvFileUrl != null;
  }
}
