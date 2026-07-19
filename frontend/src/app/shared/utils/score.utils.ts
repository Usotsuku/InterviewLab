export type ScoreVariant = 'primary' | 'success' | 'warning' | 'danger';

export function formatScore(value: number | null | undefined, decimals = 1): string {
  if (value == null) return '—';
  return value.toFixed(decimals);
}

export function scoreVariant(value: number | null | undefined): ScoreVariant {
  if (value == null) return 'primary';
  if (value >= 80) return 'success';
  if (value >= 60) return 'warning';
  return 'danger';
}

export function scoreGrade(value: number | null | undefined): string | null {
  if (value == null) return null;
  if (value >= 90) return 'A';
  if (value >= 80) return 'B';
  if (value >= 70) return 'C';
  if (value >= 60) return 'D';
  return 'F';
}

export function scoreSummary(value: number | null | undefined): string | null {
  if (value == null) return null;
  if (value >= 90) return 'Excellent performance. You demonstrated strong mastery across all areas.';
  if (value >= 80) return 'Good performance. Solid answers with room for minor improvements.';
  if (value >= 70) return 'Decent performance. Some areas need improvement.';
  if (value >= 60) return 'Below average. Focus on strengthening core concepts.';
  return 'Needs improvement. Consider revisiting fundamentals.';
}
