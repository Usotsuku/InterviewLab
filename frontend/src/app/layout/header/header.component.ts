import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AuthStore } from '../../core/auth/auth.store';
import { ThemeService } from '../../core/theme/theme.service';
import { IlAvatarComponent } from '../../shared/components/avatar/avatar.component';

@Component({
  selector: 'il-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatButtonModule, MatMenuModule, IlAvatarComponent],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  readonly authStore = inject(AuthStore);
  readonly themeService = inject(ThemeService);
  private readonly _router = inject(Router);

  onLogout(): void {
    this.authStore.logout();
    this._router.navigate(['/auth/login']);
  }
}
