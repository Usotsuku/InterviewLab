import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { InterviewMode } from '../../../../core/models/domain.enums';

@Component({
  selector: 'il-mode-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  templateUrl: './mode-card.component.html',
})
export class IlModeCardComponent {
  mode = input.required<InterviewMode>();
  selected = input(false);
  disabled = input(false);

  selectedChange = output<InterviewMode>();

  readonly modeConfig = computed(() => {
    const configs: Record<InterviewMode, { icon: string; title: string; description: string }> = {
      HR: {
        icon: 'people',
        title: 'HR & Behavioral',
        description: 'Behavioral questions, culture fit, soft skills assessment',
      },
      TECHNICAL: {
        icon: 'code',
        title: 'Technical',
        description: 'Algorithms, system design, coding challenges',
      },
      MIXED: {
        icon: 'tune',
        title: 'Mixed',
        description: 'Balanced mix of technical and behavioral questions',
      },
    };
    return configs[this.mode()];
  });

  readonly cardClass = computed(() => {
    const base = 'il-card p-5 cursor-pointer transition-all duration-fast border-2';
    if (this.disabled()) {
      return `${base} opacity-50 cursor-not-allowed border-transparent`;
    }
    return this.selected()
      ? `${base} border-primary-500 bg-primary-50/30`
      : `${base} border-transparent hover:border-neutral-300`;
  });

  onSelect(): void {
    if (!this.disabled()) {
      this.selectedChange.emit(this.mode());
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if ((event.key === 'Enter' || event.key === ' ') && !this.disabled()) {
      event.preventDefault();
      this.selectedChange.emit(this.mode());
    }
  }
}
