import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * NotificationService — thin wrapper around Angular Material SnackBar.
 * This is the single place all toast notifications are triggered from.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private readonly _snackBar: MatSnackBar) {}

  showSuccess(message: string, durationMs = 3000): void {
    this._snackBar.open(message, '✕', {
      duration: durationMs,
      panelClass: ['il-snack--success'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  showError(message: string, durationMs = 5000): void {
    this._snackBar.open(message, '✕', {
      duration: durationMs,
      panelClass: ['il-snack--error'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  showInfo(message: string, durationMs = 3000): void {
    this._snackBar.open(message, '✕', {
      duration: durationMs,
      panelClass: ['il-snack--info'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  showWarning(message: string, durationMs = 4000): void {
    this._snackBar.open(message, '✕', {
      duration: durationMs,
      panelClass: ['il-snack--warning'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}
