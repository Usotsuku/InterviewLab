import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IlButtonComponent } from '../../button/button.component';

@Component({
  selector: 'il-not-found',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IlButtonComponent],
  templateUrl: './not-found.component.html',
})
export class NotFoundComponent {}
