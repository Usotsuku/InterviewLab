import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';
import { IlCardComponent } from '@shared/components/card/card.component';

interface QuickAction {
  label: string;
  icon: string;
  route: string;
  color: string;
}

@Component({
  selector: 'il-quick-actions-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, NgClass, IlCardComponent],
  templateUrl: './quick-actions-card.component.html',
  styleUrl: './quick-actions-card.component.scss',
})
export class IlQuickActionsCardComponent {
  readonly actions: QuickAction[] = [
    { label: 'Start Interview', icon: 'play_arrow', route: '/interview', color: 'bg-primary-500' },
    { label: 'Upload CV', icon: 'upload_file', route: '/profile', color: 'bg-success-500' },
    { label: 'View History', icon: 'history', route: '/history', color: 'bg-info' },
    { label: 'Edit Profile', icon: 'person', route: '/profile/edit', color: 'bg-warning-500' },
  ];
}
