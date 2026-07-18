import { Pipe, PipeTransform } from '@angular/core';

/**
 * DurationPipe — formats seconds as mm:ss or hh:mm:ss.
 */
@Pipe({ name: 'ilDuration', standalone: true })
export class DurationPipe implements PipeTransform {
  transform(totalSeconds: number | null | undefined): string {
    if (totalSeconds == null || totalSeconds < 0) return '00:00';

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');

    if (hours > 0) {
      const hh = String(hours).padStart(2, '0');
      return `${hh}:${mm}:${ss}`;
    }
    return `${mm}:${ss}`;
  }
}

/**
 * ScorePipe — formats a 0-100 score with a color class.
 */
@Pipe({ name: 'ilScore', standalone: true })
export class ScorePipe implements PipeTransform {
  transform(score: number | null | undefined): string {
    if (score == null) return '--';
    return `${Math.round(score)}%`;
  }
}

/**
 * RelativeDatePipe — formats a date string as relative time ("2 hours ago", "yesterday").
 */
@Pipe({ name: 'ilRelativeDate', standalone: true })
export class RelativeDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    if (!value) return '';

    const date = typeof value === 'string' ? new Date(value) : value;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString();
  }
}

/**
 * TruncatePipe — truncates text to a max length with ellipsis.
 */
@Pipe({ name: 'ilTruncate', standalone: true })
export class TruncatePipe implements PipeTransform {
  transform(value: string | null | undefined, maxLength: number = 100): string {
    if (!value || value.length <= maxLength) return value ?? '';
    return value.substring(0, maxLength).trimEnd() + '...';
  }
}
