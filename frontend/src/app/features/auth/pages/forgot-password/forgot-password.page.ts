import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ForgotPasswordStore } from '../../forgot-password.store';
import { IlButtonComponent } from '../../../../shared/components/button/button.component';
import { IlFormErrorComponent } from '../../../../shared/components/form-error/form-error.component';

@Component({
  selector: 'il-forgot-password-page',
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
  templateUrl: './forgot-password.page.html',
  styleUrl: './forgot-password.page.scss',
})
export class ForgotPasswordPage {
  private readonly _fb = inject(FormBuilder);
  readonly store = inject(ForgotPasswordStore);

  readonly form = this._fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  get email() { return this.form.controls.email; }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    await this.store.sendResetEmail(this.form.getRawValue().email);
  }
}
