import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ProfileEditStore } from '../../profile-edit.store';
import { IlButtonComponent } from '../../../../shared/components/button/button.component';
import { IlFormErrorComponent } from '../../../../shared/components/form-error/form-error.component';
import { IlChipEditorComponent } from '../../components/chip-editor/chip-editor.component';
import { IlExperienceCardComponent } from '../../components/experience-card/experience-card.component';
import { IlProjectCardComponent } from '../../components/project-card/project-card.component';
import { IlSpinnerComponent } from '../../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'il-profile-edit',
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
    IlChipEditorComponent,
    IlExperienceCardComponent,
    IlProjectCardComponent,
    IlSpinnerComponent,
  ],
  templateUrl: './profile-edit.page.html',
})
export class ProfileEditPage implements OnInit {
  private readonly _fb = inject(FormBuilder);
  private readonly _router = inject(Router);
  readonly store = inject(ProfileEditStore);

  readonly form = this._fb.nonNullable.group({
    summary: ['', [Validators.maxLength(1000)]],
  });

  get summary() { return this.form.controls.summary; }

  ngOnInit(): void {
    this.store.load();
  }

  async onSave(): Promise<void> {
    const dto = {
      summary: this.summary.value || undefined,
      skills: this.store.skills(),
      technologies: this.store.technologies(),
      strengths: this.store.strengths(),
      weaknesses: this.store.weaknesses(),
    };
    const success = await this.store.save(dto);
    if (success) {
      this._router.navigate(['/profile']);
    }
  }

  onSkillsChange(items: string[]): void {
    this.store.updateSkills(items);
  }

  onTechnologiesChange(items: string[]): void {
    this.store.updateTechnologies(items);
  }

  onStrengthsChange(items: string[]): void {
    this.store.updateStrengths(items);
  }

  onWeaknessesChange(items: string[]): void {
    this.store.updateWeaknesses(items);
  }

  syncSummary(): void {
    this.store.updateSummary(this.summary.value);
  }
}
