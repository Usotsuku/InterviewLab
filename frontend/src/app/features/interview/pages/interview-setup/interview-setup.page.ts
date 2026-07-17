import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { inject } from '@angular/core';

@Component({
  selector: 'il-interview-setup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatSelectModule, MatFormFieldModule, FormsModule],
  template: `
    <section class="setup">
      <h1 class="setup__title">Start Interview Session</h1>
      <p class="setup__desc">Configure your session parameters before we begin.</p>

      <div class="il-card setup__card">
        <mat-form-field appearance="outline">
          <mat-label>Interview Mode</mat-label>
          <mat-select [(ngModel)]="mode" name="mode">
            <mat-option value="TECHNICAL">Technical</mat-option>
            <mat-option value="HR">HR</mat-option>
            <mat-option value="MIXED">Mixed</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Difficulty</mat-label>
          <mat-select [(ngModel)]="difficulty" name="difficulty">
            <mat-option value="EASY">Easy</mat-option>
            <mat-option value="MEDIUM">Medium</mat-option>
            <mat-option value="HARD">Hard</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Number of Questions</mat-label>
          <mat-select [(ngModel)]="questionCount" name="count">
            <mat-option [value]="5">5 Questions</mat-option>
            <mat-option [value]="10">10 Questions</mat-option>
            <mat-option [value]="15">15 Questions</mat-option>
          </mat-select>
        </mat-form-field>

        <button mat-raised-button color="primary" class="setup__btn" (click)="onStart()">
          Begin Session
        </button>
      </div>
    </section>
  `,
  styles: [`
    .setup__title { margin-bottom: 8px; }
    .setup__desc { margin-bottom: 28px; }
    .setup__card { max-width: 480px; display: flex; flex-direction: column; gap: 8px; }
    .setup__btn { height: 44px; margin-top: 8px; }
  `],
})
export class InterviewSetupPage {
  private readonly _router = inject(Router);
  mode = 'TECHNICAL';
  difficulty = 'MEDIUM';
  questionCount = 10;

  onStart(): void {
    // TODO: call InterviewApiService.create() then navigate to session
    this._router.navigate(['/interview', 'mock_session_id', 'session']);
  }
}
