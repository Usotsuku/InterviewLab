import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ListStore } from '../../core/store/list.store';
import { InterviewApiService } from '../../core/interview/interview-api.service';
import { Interview } from '../../core/models/domain.models';
import { extractErrorMessage } from '../../core/http/error-message';

export type HistoryFilter = 'ALL' | 'COMPLETED' | 'IN_PROGRESS';
export type HistorySortBy = 'createdAt' | 'overallScore' | 'title';
export type HistorySortOrder = 'asc' | 'desc';

@Injectable({ providedIn: 'root' })
export class HistoryListStore extends ListStore<Interview> {
  private readonly _api = inject(InterviewApiService);

  private readonly _filter = signal<HistoryFilter>('ALL');
  private readonly _sortBy = signal<HistorySortBy>('createdAt');
  private readonly _sortOrder = signal<HistorySortOrder>('desc');
  private readonly _search = signal('');
  private readonly _allItems = signal<Interview[]>([]);

  readonly filter = computed(() => this._filter());
  readonly sortBy = computed(() => this._sortBy());
  readonly sortOrder = computed(() => this._sortOrder());
  readonly search = computed(() => this._search());

  readonly filteredItems = computed(() => {
    let result = this._allItems();

    if (this._search()) {
      const q = this._search().toLowerCase();
      result = result.filter(
        (i) => (i.title ?? '').toLowerCase().includes(q) || i.mode.toLowerCase().includes(q),
      );
    }

    if (this._filter() !== 'ALL') {
      result = result.filter((i) => i.status === this._filter());
    }

    const key = this._sortBy();
    const order = this._sortOrder() === 'asc' ? 1 : -1;
    result = [...result].sort((a, b) => {
      const aVal = a[key] ?? '';
      const bVal = b[key] ?? '';
      if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * order;
      return String(aVal).localeCompare(String(bVal)) * order;
    });

    return result;
  });

  override readonly isEmpty = computed(() => this.filteredItems().length === 0 && !this.loading());

  constructor() {
    super(20);
  }

  setFilter(filter: HistoryFilter): void {
    this._filter.set(filter);
  }

  setSort(sortBy: HistorySortBy, order: HistorySortOrder): void {
    this._sortBy.set(sortBy);
    this._sortOrder.set(order);
  }

  setSearch(query: string): void {
    this._search.set(query);
  }

  async loadInterviews(): Promise<void> {
    this._setLoading(true);
    this._setError(null);
    try {
      const res = await firstValueFrom(this._api.getInterviews());
      this._allItems.set(res.data);
      this._setItems(res.data, res.data.length);
    } catch (err: unknown) {
      this._setError(extractErrorMessage(err, 'Failed to load interviews'));
      this._setLoading(false);
    }
  }

  async deleteInterview(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this._api.deleteInterview(id));
      const updated = this._allItems().filter((i) => i.id !== id);
      this._allItems.set(updated);
      this._setItems(updated, updated.length);
      return true;
    } catch {
      return false;
    }
  }

}
