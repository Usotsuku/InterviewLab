import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

@Component({
  selector: 'il-chip-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatChipsModule, MatIconModule],
  templateUrl: './chip-editor.component.html',
})
export class IlChipEditorComponent {
  label = input('Items');
  placeholder = input('Add item...');
  items = input<string[]>([]);
  itemsChange = output<string[]>();
  readonly separatorKeyCodes = [ENTER, COMMA] as const;

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.itemsChange.emit([...this.items(), value]);
    }
    event.chipInput.clear();
  }

  remove(item: string): void {
    this.itemsChange.emit(this.items().filter(i => i !== item));
  }
}
