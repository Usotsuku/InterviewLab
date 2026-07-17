import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'il-profile-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule, MatChipsModule, MatIconModule],
  template: `
    <section class="profile">
      <div class="profile__header">
        <h1>Candidate Profile</h1>
        <button mat-stroked-button routerLink="edit">
          <mat-icon>edit</mat-icon> Edit Profile
        </button>
      </div>

      <div class="profile__grid">
        <!-- Summary Card -->
        <div class="il-card">
          <h3>Professional Summary</h3>
          <p class="profile__placeholder">No summary added yet. <a routerLink="edit">Add one.</a></p>
        </div>

        <!-- CV Card -->
        <div class="il-card">
          <h3>CV / Résumé</h3>
          <p class="profile__placeholder">Upload your CV for AI-powered profile extraction.</p>
          <button mat-stroked-button color="primary" class="profile__upload-btn">
            <mat-icon>upload_file</mat-icon> Upload CV
          </button>
        </div>

        <!-- Skills -->
        <div class="il-card">
          <h3>Skills &amp; Technologies</h3>
          <p class="profile__placeholder">No skills added yet.</p>
        </div>

        <!-- Experience -->
        <div class="il-card">
          <h3>Experience</h3>
          <p class="profile__placeholder">No experience entries yet.</p>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .profile__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
    .profile__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .profile__placeholder { color: var(--il-text-muted); font-size: var(--il-font-sm); margin-top: 12px; }
    .profile__upload-btn { margin-top: 16px; }
  `],
})
export class ProfileViewPage {}
