import { Directive, ElementRef, EventEmitter, OnDestroy, OnInit, Output, inject } from '@angular/core';

/**
 * ClickOutsideDirective — emits when a click occurs outside the host element.
 */
@Directive({ selector: '[ilClickOutside]', standalone: true })
export class ClickOutsideDirective implements OnInit, OnDestroy {
  @Output() ilClickOutside = new EventEmitter<void>();

  private readonly _el = inject(ElementRef<HTMLElement>);
  private readonly _handler = (event: Event) => this._onDocumentClick(event);

  ngOnInit(): void {
    document.addEventListener('click', this._handler, true);
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this._handler, true);
  }

  private _onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const host = this._el.nativeElement;
    if (!host.contains(target)) {
      this.ilClickOutside.emit();
    }
  }
}
