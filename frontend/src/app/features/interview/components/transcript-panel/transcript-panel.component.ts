import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'il-transcript-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './transcript-panel.component.html',
})
export class IlTranscriptPanelComponent {
  finalTranscript = input('');
  interimTranscript = input('');
  isRecording = input(false);
  hasContent = input(false);
}
