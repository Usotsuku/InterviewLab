import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'il-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.scss',
})
export class IlSkeletonComponent {
  variant = input<'block' | 'circle' | 'text'>('block');
  width = input<string>('100%');
  height = input<string>('20px');
}
