import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../../../core/auth/auth.store';
import { IlButtonComponent } from '../../../../shared/components/button/button.component';
import { IlFormErrorComponent } from '../../../../shared/components/form-error/form-error.component';

@Component({
  selector: 'il-login-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatIconModule,
    IlButtonComponent,
    IlFormErrorComponent,
  ],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private readonly _fb = inject(FormBuilder);
  private readonly _router = inject(Router);
  readonly authStore = inject(AuthStore);

  hidePassword = true;

  readonly form = this._fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  get email() { return this.form.controls.email; }
  get password() { return this.form.controls.password; }

  get errorMessage(): string | null {
    return this.authStore.error();
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password } = this.form.getRawValue();
    const success = await this.authStore.login(email, password);
    if (success) {
      this._router.navigate(['/dashboard']);
    }
  }
}
