import { Component, input } from '@angular/core';

@Component({
  selector: 'il-form-error',
  standalone: true,
  templateUrl: './form-error.component.html',
})
export class IlFormErrorComponent {
  show = input.required<boolean>();
  message = input.required<string>();
}
