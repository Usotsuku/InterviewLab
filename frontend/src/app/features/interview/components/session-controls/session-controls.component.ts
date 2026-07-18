import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { IlButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'il-session-controls',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IlButtonComponent],
  templateUrl: './session-controls.component.html',
})
export class IlSessionControlsComponent {
  isRecording = input(false);
  isSubmitting = input(false);
  canRecord = input(true);
  permissionGranted = input(false);

  startRecording = output<void>();
  stopRecording = output<void>();
  requestPermission = output<void>();
}
