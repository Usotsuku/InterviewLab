export interface MetricsInput {
  transcript: string;
  durationSeconds: number;
  expectedKeywords: string[];
  estimatedAnswerDuration?: number;
}

export interface MetricsResult {
  wordsPerMinute: number;
  answerDuration: number;
  pauseCount: number;
  averagePause: number;
  longestPause: number;
  fillerCount: number;
  vocabularyRichness: number;
  repetitionScore: number;
  keywordCoverage: number;
  confidenceScore: number;
}

export interface PauseMetrics {
  pauseCount: number;
  averagePause: number;
  longestPause: number;
}

export interface ConfidenceInput {
  wordsPerMinute: number;
  pauseCount: number;
  averagePause: number;
  longestPause: number;
  vocabularyRichness: number;
  fillerCount: number;
  repetitionScore: number;
  keywordCoverage: number;
  answerDuration: number;
  wordCount: number;
}
