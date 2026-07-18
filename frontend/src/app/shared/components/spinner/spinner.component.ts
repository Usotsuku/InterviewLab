import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'il-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './spinner.component.html',
})
export class IlSpinnerComponent {
  size = input<'sm' | 'md' | 'lg'>('md');
  label = input<string>();

  spinnerClass = computed(() => {
    const sizeMap = { sm: 'flex flex-col items-center gap-3', md: 'flex flex-col items-center gap-3', lg: 'flex flex-col items-center gap-3' };
    return sizeMap[this.size()];
  });
}
