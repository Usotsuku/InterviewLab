import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'il-form-error',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './form-error.component.html',
  styleUrl: './form-error.component.scss',
})
export class IlFormErrorComponent {
  show = input.required<boolean>();
  message = input.required<string>();
}
