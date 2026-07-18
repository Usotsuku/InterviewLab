import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { IlCardComponent } from '@shared/components/card/card.component';

export interface StatItem {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}

@Component({
  selector: 'il-statistics-cards',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, MatIconModule, IlCardComponent],
  templateUrl: './statistics-cards.component.html',
})
export class IlStatisticsCardsComponent {
  stats = input<StatItem[]>([]);
}
