import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ResetPasswordStore } from '../../reset-password.store';
import { IlButtonComponent } from '../../../../shared/components/button/button.component';
import { IlFormErrorComponent } from '../../../../shared/components/form-error/form-error.component';
import { passwordStrengthValidator, matchFieldValidator } from '../../../../shared/validators/form.validators';

@Component({
  selector: 'il-reset-password-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    IlButtonComponent,
    IlFormErrorComponent,
  ],
  templateUrl: './reset-password.page.html',
})
export class ResetPasswordPage {
  private readonly _fb = inject(FormBuilder);
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  readonly store = inject(ResetPasswordStore);

  hidePassword = true;
  hideConfirm = true;

  readonly token: string = this._route.snapshot.queryParamMap.get('token') ?? '';

  readonly form = this._fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator()]],
    confirmPassword: ['', [Validators.required, matchFieldValidator('password')]],
  });

  get password() { return this.form.controls.password; }
  get confirmPassword() { return this.form.controls.confirmPassword; }

  get hasValidToken(): boolean {
    return this.token.length > 0;
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
    const success = await this.store.resetPassword(this.token, this.form.getRawValue().password);
    if (success) {
      setTimeout(() => this._router.navigate(['/auth/login']), 3000);
    }
  }
}
