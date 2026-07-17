import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'il-profile-edit',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <section class="profile-edit">
      <div class="profile-edit__header">
        <h1>Edit Profile</h1>
        <button mat-stroked-button routerLink="/profile">Cancel</button>
      </div>
      <div class="il-card profile-edit__form">
        <mat-form-field appearance="outline">
          <mat-label>Full Name</mat-label>
          <input matInput [(ngModel)]="name" name="name" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Professional Summary</mat-label>
          <textarea matInput [(ngModel)]="summary" name="summary" rows="4"></textarea>
        </mat-form-field>
        <button mat-raised-button color="primary">Save Changes</button>
      </div>
    </section>
  `,
  styles: [`
    .profile-edit__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
    .profile-edit__form { max-width: 600px; display: flex; flex-direction: column; gap: 8px; }
  `],
})
export class ProfileEditPage {
  name = '';
  summary = '';
}
