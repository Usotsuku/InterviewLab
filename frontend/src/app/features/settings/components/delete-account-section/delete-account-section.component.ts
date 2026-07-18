import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { IlCardComponent } from '@shared/components/card/card.component';
import { IlButtonComponent } from '@shared/components/button/button.component';

@Component({
  selector: 'il-delete-account-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, IlCardComponent, IlButtonComponent],
  templateUrl: './delete-account-section.component.html',
})
export class IlDeleteAccountSectionComponent {
  isLoading = input(false);

  deleteClick = output<void>();

  showConfirm = false;

  onToggleConfirm(): void {
    this.showConfirm = !this.showConfirm;
  }

  onConfirmDelete(): void {
    this.deleteClick.emit();
  }
}
