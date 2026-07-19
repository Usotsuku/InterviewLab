import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../../../core/auth/auth.store';
import { IlButtonComponent } from '../../../../shared/components/button/button.component';
import { IlFormErrorComponent } from '../../../../shared/components/form-error/form-error.component';
import {
  passwordStrengthValidator,
  matchFieldValidator,
  noWhitespaceValidator,
} from '../../../../shared/validators/form.validators';

@Component({
  selector: 'il-register-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatIconModule,
    IlButtonComponent,
    IlFormErrorComponent,
  ],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss',
})
export class RegisterPage {
  private readonly _fb = inject(FormBuilder);
  private readonly _router = inject(Router);
  readonly authStore = inject(AuthStore);

  hidePassword = true;
  hideConfirm = true;

  readonly form = this._fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), noWhitespaceValidator()]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator()]],
    confirmPassword: ['', [Validators.required, matchFieldValidator('password')]],
  });

  get name() { return this.form.controls.name; }
  get email() { return this.form.controls.email; }
  get password() { return this.form.controls.password; }
  get confirmPassword() { return this.form.controls.confirmPassword; }

  get errorMessage(): string | null {
    return this.authStore.error();
  }

  get passwordStrength() {
    const errors = this.password.errors?.['passwordStrength'];
    if (!errors) return null;
    return {
      minLength: errors.hasMinLength as boolean,
      upperCase: errors.hasUpperCase as boolean,
      lowerCase: errors.hasLowerCase as boolean,
      number: errors.hasNumber as boolean,
    };
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, email, password } = this.form.getRawValue();
    const success = await this.authStore.register(name, email, password);
    if (success) {
      this._router.navigate(['/dashboard']);
    }
  }
}
