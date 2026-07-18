import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { IlBadgeComponent } from '../../../../shared/components/badge/badge.component';
import { CvAnalysisStatus } from '../../../../core/models/domain.enums';

@Component({
  selector: 'il-profile-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, IlBadgeComponent],
  templateUrl: './profile-header.component.html',
})
export class IlProfileHeaderComponent {
  name = input.required<string>();
  email = input.required<string>();
  completionPercent = input(0);
  cvStatus = input<CvAnalysisStatus>('NOT_UPLOADED' as CvAnalysisStatus);
  cvFileName = input<string | null>(null);
  editing = input(false);
}
