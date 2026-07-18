import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HistoryListStore } from '../../history-list.store';
import { IlInterviewHistoryFiltersComponent } from '../../components/interview-history-filters/interview-history-filters.component';
import { IlInterviewHistoryListComponent } from '../../components/interview-history-list/interview-history-list.component';
import { IlSpinnerComponent } from '@shared/components/spinner/spinner.component';

@Component({
  selector: 'il-history-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IlInterviewHistoryFiltersComponent, IlInterviewHistoryListComponent, IlSpinnerComponent],
  templateUrl: './history-list.page.html',
})
export class HistoryListPage implements OnInit {
  readonly store = inject(HistoryListStore);
  private readonly _router = inject(Router);

  ngOnInit(): void {
    this.store.loadInterviews();
  }

  onStartInterview(): void {
    this._router.navigate(['/interview']);
  }

  onFilterChange(filter: 'ALL' | 'COMPLETED' | 'IN_PROGRESS'): void {
    this.store.setFilter(filter);
  }

  onSortChange(event: { sortBy: 'createdAt' | 'overallScore' | 'title'; order: 'asc' | 'desc' }): void {
    this.store.setSort(event.sortBy, event.order);
  }

  onSearchChange(query: string): void {
    this.store.setSearch(query);
  }

  onDeleteInterview(id: string): void {
    this.store.deleteInterview(id);
  }
}
