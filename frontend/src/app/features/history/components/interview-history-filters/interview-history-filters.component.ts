import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { IlButtonComponent } from '@shared/components/button/button.component';
import { HistoryFilter, HistorySortBy, HistorySortOrder } from '../../history-list.store';

@Component({
  selector: 'il-interview-history-filters',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatIconModule, IlButtonComponent],
  templateUrl: './interview-history-filters.component.html',
})
export class IlInterviewHistoryFiltersComponent {
  filter = input<HistoryFilter>('ALL');
  sortBy = input<HistorySortBy>('createdAt');
  sortOrder = input<HistorySortOrder>('desc');
  search = input('');

  filterChange = output<HistoryFilter>();
  sortChange = output<{ sortBy: HistorySortBy; order: HistorySortOrder }>();
  searchChange = output<string>();

  filters: { value: HistoryFilter; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
  ];

  onFilterChange(value: HistoryFilter): void {
    this.filterChange.emit(value);
  }

  onSortToggle(): void {
    const nextOrder = this.sortOrder() === 'desc' ? 'asc' : 'desc';
    this.sortChange.emit({ sortBy: this.sortBy(), order: nextOrder });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchChange.emit(value);
  }
}
