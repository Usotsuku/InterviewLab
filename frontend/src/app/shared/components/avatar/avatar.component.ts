import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'il-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
})
export class IlAvatarComponent {
  src = input<string>();
  name = input('');
  size = input<'sm' | 'md' | 'lg' | 'xl'>('md');

  avatarClass = computed(() => `il-avatar il-avatar--${this.size()}`);

  initials = computed(() => {
    const parts = this.name().trim().split(/\s+/);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  });
}
