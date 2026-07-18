import { Injectable, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { EntityStore } from '../../core/store/entity.store';
import { CandidateProfile } from '../../core/models/domain.models';
import { CvAnalysisStatus } from '../../core/models/domain.enums';
import { ProfileApiService } from '../../core/profile/profile-api.service';

@Injectable({ providedIn: 'root' })
export class ProfileViewStore extends EntityStore<CandidateProfile> {
  private readonly _api = inject(ProfileApiService);

  readonly summary = computed(() => this.entity()?.summary ?? '');
  readonly skills = computed(() => this.entity()?.skills ?? []);
  readonly technologies = computed(() => this.entity()?.technologies ?? []);
  readonly strengths = computed(() => this.entity()?.strengths ?? []);
  readonly weaknesses = computed(() => this.entity()?.weaknesses ?? []);
  readonly experience = computed(() => this.entity()?.experience ?? []);
  readonly projects = computed(() => this.entity()?.projects ?? []);
  readonly completionPercent = computed(() => this.entity()?.completionPercent ?? 0);
  readonly cvAnalysisStatus = computed(() => this.entity()?.cvAnalysisStatus ?? ('NOT_UPLOADED' as CvAnalysisStatus));
  readonly cvFileName = computed(() => this.entity()?.cvFileName ?? null);

  get hasCv(): boolean {
    return this.entity()?.cvFileUrl != null;
  }

  async load(): Promise<void> {
    this._setLoading(true);
    this._setError(null);
    try {
      const res = await firstValueFrom(this._api.getMyProfile());
      this._setEntity(res.data);
    } catch (err: unknown) {
      this._setState({ loading: false, error: this._extractError(err) });
    }
  }

  async deleteProfile(): Promise<boolean> {
    this._setLoading(true);
    this._setError(null);
    try {
      await firstValueFrom(this._api.deleteMyProfile());
      this._clearEntity();
      return true;
    } catch (err: unknown) {
      this._setState({ loading: false, error: this._extractError(err) });
      return false;
    }
  }

  private _extractError(err: unknown): string {
    if (err instanceof Object && 'error' in err) {
      const httpErr = err as { error: { message?: string } };
      return httpErr.error?.message ?? 'Failed to load profile';
    }
    return 'Failed to load profile';
  }
}
