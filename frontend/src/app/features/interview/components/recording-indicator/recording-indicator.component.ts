import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'il-recording-indicator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recording-indicator.component.html',
})
export class IlRecordingIndicatorComponent {
  durationSeconds = input(0);
  active = input(false);

  formattedDuration = computed(() => {
    const s = this.durationSeconds();
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  });
}
