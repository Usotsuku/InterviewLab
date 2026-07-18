import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { IlCardComponent } from '@shared/components/card/card.component';
import { IlButtonComponent } from '@shared/components/button/button.component';
import { IlFormErrorComponent } from '@shared/components/form-error/form-error.component';

@Component({
  selector: 'il-password-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatIconModule, IlCardComponent, IlButtonComponent, IlFormErrorComponent],
  templateUrl: './password-section.component.html',
})
export class IlPasswordSectionComponent {
  isLoading = input(false);
  error = input<string | null>(null);

  passwordChange = output<{ currentPassword: string; newPassword: string }>();

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  currentPasswordError = '';
  newPasswordError = '';
  confirmPasswordError = '';

  get isValid(): boolean {
    return (
      this.currentPassword.length > 0 &&
      this.newPassword.length >= 8 &&
      this.newPassword === this.confirmPassword
    );
  }

  validate(): boolean {
    let valid = true;

    if (this.currentPassword.length === 0) {
      this.currentPasswordError = 'Current password is required';
      valid = false;
    } else {
      this.currentPasswordError = '';
    }

    if (this.newPassword.length < 8) {
      this.newPasswordError = 'Password must be at least 8 characters';
      valid = false;
    } else {
      this.newPasswordError = '';
    }

    if (this.newPassword !== this.confirmPassword) {
      this.confirmPasswordError = 'Passwords do not match';
      valid = false;
    } else {
      this.confirmPasswordError = '';
    }

    return valid;
  }

  onSubmit(): void {
    if (this.validate()) {
      this.passwordChange.emit({
        currentPassword: this.currentPassword,
        newPassword: this.newPassword,
      });
    }
  }
}
