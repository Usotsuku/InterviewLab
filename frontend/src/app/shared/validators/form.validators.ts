import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * passwordStrengthValidator — requires minimum 8 chars, one uppercase, one lowercase, one number.
 */
export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    const hasMinLength = value.length >= 8;
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);

    const valid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber;
    if (valid) return null;

    return {
      passwordStrength: {
        hasMinLength,
        hasUpperCase,
        hasLowerCase,
        hasNumber,
      },
    };
  };
}

/**
 * matchFieldValidator — cross-field validator to confirm two fields match.
 * Usage: form.get('confirm')?.setValidators(matchFieldValidator('password'));
 */
export function matchFieldValidator(fieldName: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const parent = control.parent;
    if (!parent) return null;

    const target = parent.get(fieldName);
    if (!target) return null;

    return control.value === target.value ? null : { fieldMismatch: { field: fieldName } };
  };
}

/**
 * noWhitespaceValidator — rejects strings that are only whitespace.
 */
export function noWhitespaceValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value || typeof value !== 'string') return null;

    return value.trim().length === 0 ? { whitespace: true } : null;
  };
}
