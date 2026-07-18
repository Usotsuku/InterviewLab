import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthStore } from '../../../../core/auth/auth.store';

@Component({
  selector: 'il-login-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.page.html',
})
export class LoginPage {
  readonly authStore = inject(AuthStore);
  private readonly _router = inject(Router);

  email = '';
  password = '';

  async onLogin(): Promise<void> {
    await this.authStore.login(this.email, this.password);
    if (this.authStore.isAuthenticated()) {
      this._router.navigate(['/dashboard']);
    }
  }
}
