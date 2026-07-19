import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  InterviewMode,
  InterviewStatus,
  QuestionType,
  QuestionDifficulty,
} from '@shared/enums/domain.enums';

export class InterviewMetricsDto {
  @ApiProperty({ example: 120 })
  wordsPerMinute!: number;

  @ApiProperty({ example: 45 })
  answerDuration!: number;

  @ApiProperty({ example: 3 })
  pauseCount!: number;

  @ApiProperty({ example: 1.2 })
  averagePause!: number;

  @ApiProperty({ example: 3.5 })
  longestPause!: number;

  @ApiProperty({ example: 2 })
  fillerCount!: number;

  @ApiProperty({ example: 0.75 })
  vocabularyRichness!: number;

  @ApiProperty({ example: 0.9 })
  repetitionScore!: number;

  @ApiProperty({ example: 0.6 })
  keywordCoverage!: number;

  @ApiProperty({ example: 0.8 })
  confidenceScore!: number;
}

export class AiEvaluationDto {
  @ApiProperty({ example: 8.5 })
  technicalScore!: number;

  @ApiProperty({ example: 7.0 })
  communicationScore!: number;

  @ApiProperty({ example: 8.0 })
  correctnessScore!: number;

  @ApiProperty({ example: 7.5 })
  completenessScore!: number;

  @ApiProperty({ type: [String], example: ['Strong explanation', 'Good examples'] })
  strengths!: string[];

  @ApiProperty({ type: [String], example: ['Missing edge cases'] })
  weaknesses!: string[];

  @ApiProperty({ type: [String], example: ['Time complexity analysis'] })
  missingConcepts!: string[];

  @ApiProperty({ type: [String], example: ['How would you handle concurrency?'] })
  followUpQuestions!: string[];

  @ApiProperty({ example: 'Good overall answer with room for improvement.' })
  feedback!: string;
}

export class QuestionReportDto {
  @ApiProperty({ example: '66554433221100aabbccddee' })
  questionId!: string;

  @ApiProperty({ example: 'Explain the difference between REST and GraphQL.' })
  text!: string;

  @ApiProperty({ enum: QuestionType, example: QuestionType.TECHNICAL })
  type!: QuestionType;

  @ApiProperty({ enum: QuestionDifficulty, example: QuestionDifficulty.MEDIUM })
  difficulty!: QuestionDifficulty;

  @ApiProperty({ example: 1 })
  order!: number;

  @ApiPropertyOptional({ type: [String] })
  targetSkills?: string[];

  @ApiPropertyOptional({ example: 45 })
  estimatedAnswerDuration?: number;

  @ApiPropertyOptional({ example: 'Explain REST vs GraphQL with examples...' })
  transcript?: string;

  @ApiPropertyOptional({ example: 30 })
  durationSeconds?: number;

  @ApiPropertyOptional({ type: InterviewMetricsDto })
  metrics?: InterviewMetricsDto;

  @ApiPropertyOptional({ type: AiEvaluationDto })
  evaluation?: AiEvaluationDto;
}

export class InterviewSummaryDto {
  @ApiProperty({ example: '66554433221100aabbccddee' })
  id!: string;

  @ApiProperty({ example: '112233445566778899001122' })
  userId!: string;

  @ApiProperty({ enum: InterviewMode, example: InterviewMode.TECHNICAL })
  mode!: InterviewMode;

  @ApiProperty({ enum: InterviewStatus, example: InterviewStatus.COMPLETED })
  status!: InterviewStatus;

  @ApiProperty({ example: 'Technical Interview: Backend Development' })
  title!: string;

  @ApiProperty({ example: 60 })
  estimatedDuration!: number;

  @ApiPropertyOptional({ example: 1200 })
  actualDurationSeconds?: number | null;

  @ApiProperty({ example: 10 })
  totalQuestions!: number;

  @ApiProperty({ example: 8.2 })
  overallScore!: number;

  @ApiProperty({ example: 7.5 })
  communicationScore!: number;

  @ApiProperty({ example: 8.8 })
  technicalScore!: number;

  @ApiProperty({ example: 8.0 })
  confidenceScore!: number;

  @ApiPropertyOptional()
  startedAt?: Date;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiProperty()
  createdAt!: Date;
}

export class InterviewReportDto {
  @ApiProperty({ type: InterviewSummaryDto })
  interview!: InterviewSummaryDto;

  @ApiProperty({ type: [QuestionReportDto] })
  questions!: QuestionReportDto[];

  @ApiProperty({ example: 8 })
  totalAnswered!: number;

  @ApiProperty({ example: 10 })
  totalQuestions!: number;

  @ApiProperty({ example: 60 })
  durationMinutes!: number;
}
