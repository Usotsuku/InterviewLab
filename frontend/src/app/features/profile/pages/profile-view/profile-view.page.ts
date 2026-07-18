import { Component, ChangeDetectionStrategy, inject, OnInit, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileViewStore } from '../../profile-view.store';
import { AuthStore } from '../../../../core/auth/auth.store';
import { IlProfileHeaderComponent } from '../../components/profile-header/profile-header.component';
import { IlProfileCompletionCardComponent } from '../../components/profile-completion-card/profile-completion-card.component';
import { IlExperienceCardComponent } from '../../components/experience-card/experience-card.component';
import { IlProjectCardComponent } from '../../components/project-card/project-card.component';
import { IlCvUploadComponent } from '../../components/cv-upload/cv-upload.component';
import { IlEmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { IlSpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { IlBadgeComponent } from '../../../../shared/components/badge/badge.component';
import { IlButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'il-profile-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IlProfileHeaderComponent,
    IlProfileCompletionCardComponent,
    IlExperienceCardComponent,
    IlProjectCardComponent,
    IlCvUploadComponent,
    IlEmptyStateComponent,
    IlSpinnerComponent,
    IlBadgeComponent,
    IlButtonComponent,
  ],
  templateUrl: './profile-view.page.html',
})
export class ProfileViewPage implements OnInit {
  readonly store = inject(ProfileViewStore);
  private readonly _authStore = inject(AuthStore);
  private readonly _router = inject(Router);

  readonly userName = computed(() => this._authStore.user()?.name ?? 'Candidate');
  readonly userEmail = computed(() => this._authStore.user()?.email ?? '');

  ngOnInit(): void {
    this.store.load();
  }

  onCreateProfile(): void {
    this._router.navigate(['/profile/edit']);
  }

  onUploadCv(): void {
    this._router.navigate(['/profile']);
  }
}
