import { Directive, ElementRef, OnInit, inject } from '@angular/core';

/**
 * AutoFocusDirective — auto-focuses the host element when rendered.
 */
@Directive({ selector: '[ilAutoFocus]', standalone: true })
export class AutoFocusDirective implements OnInit {
  private readonly _el = inject(ElementRef<HTMLElement>);

  ngOnInit(): void {
    setTimeout(() => this._el.nativeElement.focus(), 0);
  }
}
