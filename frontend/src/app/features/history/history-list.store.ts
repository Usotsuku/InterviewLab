import { Injectable, computed } from '@angular/core';
import { Interview } from '../../core/models/domain.models';
import { ListStore } from '../../core/store/list.store';

@Injectable({ providedIn: 'root' })
export class HistoryListStore extends ListStore<Interview> {
  constructor() {
    super(20);
  }
}
