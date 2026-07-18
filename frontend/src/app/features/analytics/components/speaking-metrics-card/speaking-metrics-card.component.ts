import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { IlCardComponent } from '@shared/components/card/card.component';
import { IlSparklineComponent, SparklineDataPoint } from '@shared/components/sparkline/sparkline.component';

@Component({
  selector: 'il-speaking-metrics-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, MatIconModule, IlCardComponent, IlSparklineComponent],
  templateUrl: './speaking-metrics-card.component.html',
})
export class IlSpeakingMetricsCardComponent {
  averageWordsPerMinute = input(0);
  averageVocabularyRichness = input(0);
  averageKeywordCoverage = input(0);
  averageFillerCount = input(0);
  averageRepetitionScore = input(0);
  averagePauseCount = input(0);

  wpmTrend = input<SparklineDataPoint[]>([]);
  vocabTrend = input<SparklineDataPoint[]>([]);
  fillerTrend = input<SparklineDataPoint[]>([]);

  metrics = computed(() => [
    {
      label: 'Words Per Minute',
      value: this.averageWordsPerMinute(),
      icon: 'record_voice_over',
      format: this.averageWordsPerMinute().toFixed(0),
      description: 'Average speaking pace',
    },
    {
      label: 'Vocabulary Richness',
      value: this.averageVocabularyRichness() * 100,
      icon: 'menu_book',
      format: (this.averageVocabularyRichness() * 100).toFixed(1) + '%',
      description: 'Word diversity score',
    },
    {
      label: 'Keyword Coverage',
      value: this.averageKeywordCoverage() * 100,
      icon: 'check_circle',
      format: (this.averageKeywordCoverage() * 100).toFixed(1) + '%',
      description: 'Key terms covered',
    },
    {
      label: 'Filler Words',
      value: Math.max(0, 100 - this.averageFillerCount() * 10),
      icon: 'chat_bubble_outline',
      format: this.averageFillerCount().toFixed(1),
      description: 'Per answer average',
    },
    {
      label: 'Repetition Score',
      value: Math.max(0, 100 - this.averageRepetitionScore() * 20),
      icon: 'repeat',
      format: this.averageRepetitionScore().toFixed(1),
      description: 'Lower is better',
    },
    {
      label: 'Avg Pauses',
      value: Math.max(0, 100 - this.averagePauseCount() * 5),
      icon: 'pause_circle',
      format: this.averagePauseCount().toFixed(1),
      description: 'Per answer average',
    },
  ]);

  barVariant(value: number): string {
    if (value >= 70) return 'bg-success-500';
    if (value >= 40) return 'bg-warning-500';
    return 'bg-danger-500';
  }
}
