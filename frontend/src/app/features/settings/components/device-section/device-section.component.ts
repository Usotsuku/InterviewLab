import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { IlCardComponent } from '@shared/components/card/card.component';

@Component({
  selector: 'il-device-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, MatIconModule, IlCardComponent],
  templateUrl: './device-section.component.html',
})
export class IlDeviceSectionComponent {
  micEnabled = input(true);
  autoTranscribe = input(true);

  micChange = output<boolean>();
  autoTranscribeChange = output<boolean>();

  onToggleMic(): void {
    this.micChange.emit(!this.micEnabled());
  }

  onToggleAutoTranscribe(): void {
    this.autoTranscribeChange.emit(!this.autoTranscribe());
  }
}
