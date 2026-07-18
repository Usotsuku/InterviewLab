import { Injectable } from '@angular/core';
import { Interview } from '../../core/models/domain.models';
import { DetailsStore } from '../../core/store/details.store';

@Injectable({ providedIn: 'root' })
export class HistoryDetailStore extends DetailsStore<Interview> {}
