import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { ProfileViewStore } from '../../profile-view.store';
import { IlProfileHeaderComponent } from '../../components/profile-header/profile-header.component';
import { IlProfileCompletionCardComponent } from '../../components/profile-completion-card/profile-completion-card.component';
import { IlExperienceCardComponent } from '../../components/experience-card/experience-card.component';
import { IlProjectCardComponent } from '../../components/project-card/project-card.component';
import { IlEmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { IlSpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { IlBadgeComponent } from '../../../../shared/components/badge/badge.component';
import { CvAnalysisStatus } from '../../../../core/models/domain.enums';

@Component({
  selector: 'il-profile-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IlProfileHeaderComponent,
    IlProfileCompletionCardComponent,
    IlExperienceCardComponent,
    IlProjectCardComponent,
    IlEmptyStateComponent,
    IlSpinnerComponent,
    IlBadgeComponent,
  ],
  templateUrl: './profile-view.page.html',
})
export class ProfileViewPage implements OnInit {
  readonly store = inject(ProfileViewStore);

  ngOnInit(): void {
    this.store.load();
  }
}
