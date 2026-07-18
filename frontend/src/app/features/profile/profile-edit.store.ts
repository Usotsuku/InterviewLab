import { Injectable, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BaseStore } from '../../core/store/base.store';
import { CandidateProfile, ExperienceEntry, ProjectEntry } from '../../core/models/domain.models';
import { ProfileApiService, UpdateProfileDto } from '../../core/profile/profile-api.service';

export interface ProfileEditState {
  profile: CandidateProfile | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  saved: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProfileEditStore extends BaseStore<ProfileEditState> {
  private readonly _api = inject(ProfileApiService);

  readonly profile = computed(() => this._state().profile);
  readonly saving = computed(() => this._state().saving);
  readonly saved = computed(() => this._state().saved);
  readonly summary = computed(() => this._state().profile?.summary ?? '');
  readonly skills = computed(() => this._state().profile?.skills ?? []);
  readonly technologies = computed(() => this._state().profile?.technologies ?? []);
  readonly strengths = computed(() => this._state().profile?.strengths ?? []);
  readonly weaknesses = computed(() => this._state().profile?.weaknesses ?? []);
  readonly experience = computed(() => this._state().profile?.experience ?? []);
  readonly projects = computed(() => this._state().profile?.projects ?? []);

  constructor() {
    super({
      profile: null,
      loading: false,
      saving: false,
      error: null,
      saved: false,
    });
  }

  async load(): Promise<void> {
    this._setLoading(true);
    this._setError(null);
    this._setState({ saved: false });
    try {
      const res = await firstValueFrom(this._api.getMyProfile());
      this._setState({ profile: res.data, loading: false });
    } catch (err: unknown) {
      this._setState({ loading: false, error: this._extractError(err) });
    }
  }

  async save(dto: UpdateProfileDto): Promise<boolean> {
    this._setState({ saving: true, error: null, saved: false });
    try {
      const res = await firstValueFrom(this._api.updateMyProfile(dto));
      this._setState({ profile: res.data, saving: false, saved: true });
      return true;
    } catch (err: unknown) {
      this._setState({ saving: false, error: this._extractError(err) });
      return false;
    }
  }

  updateSummary(summary: string): void {
    const current = this._state().profile;
    if (current) {
      this._setState({ profile: { ...current, summary } });
    }
  }

  updateSkills(skills: string[]): void {
    const current = this._state().profile;
    if (current) {
      this._setState({ profile: { ...current, skills } });
    }
  }

  updateTechnologies(technologies: string[]): void {
    const current = this._state().profile;
    if (current) {
      this._setState({ profile: { ...current, technologies } });
    }
  }

  updateStrengths(strengths: string[]): void {
    const current = this._state().profile;
    if (current) {
      this._setState({ profile: { ...current, strengths } });
    }
  }

  updateWeaknesses(weaknesses: string[]): void {
    const current = this._state().profile;
    if (current) {
      this._setState({ profile: { ...current, weaknesses } });
    }
  }

  private _extractError(err: unknown): string {
    if (err instanceof Object && 'error' in err) {
      const httpErr = err as { error: { message?: string } };
      return httpErr.error?.message ?? 'Failed to save profile';
    }
    return 'Failed to save profile';
  }
}
