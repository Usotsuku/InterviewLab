import { Types } from 'mongoose';
import { QuestionDocument } from '@modules/question/schemas/question.schema';
import { AnswerDocument } from '@modules/answer/schemas/answer.schema';
import { InterviewMetricsDocument } from '@modules/metrics/schemas/interview-metrics.schema';
import { AiEvaluationDocument } from '@modules/ai/schemas/ai-evaluation.schema';
import {
  InterviewMode,
  InterviewStatus,
  QuestionType,
  QuestionDifficulty,
} from '@shared/enums/domain.enums';
import {
  InterviewSummaryDto,
  QuestionReportDto,
  InterviewMetricsDto,
  AiEvaluationDto,
  InterviewReportDto,
} from '../dto/interview-report.dto';

interface InterviewDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  mode: InterviewMode;
  status: InterviewStatus;
  title?: string;
  estimatedDuration?: number;
  totalQuestions?: number;
  currentQuestionIndex?: number;
  overallScore?: number;
  communicationScore?: number;
  technicalScore?: number;
  confidenceScore?: number;
  startedAt?: Date | null;
  completedAt?: Date | null;
  createdAt?: Date;
}

function toId(value: Types.ObjectId | string): string {
  return value instanceof Types.ObjectId ? value.toString() : String(value);
}

export function mapMetrics(doc: InterviewMetricsDocument | null): InterviewMetricsDto | undefined {
  if (!doc) return undefined;

  const raw = doc as unknown as Record<string, unknown>;
  const dto = new InterviewMetricsDto();
  dto.wordsPerMinute = (raw['wordsPerMinute'] as number) ?? 0;
  dto.answerDuration = (raw['answerDuration'] as number) ?? 0;
  dto.pauseCount = (raw['pauseCount'] as number) ?? 0;
  dto.averagePause = (raw['averagePause'] as number) ?? 0;
  dto.longestPause = (raw['longestPause'] as number) ?? 0;
  dto.fillerCount = (raw['fillerCount'] as number) ?? 0;
  dto.vocabularyRichness = (raw['vocabularyRichness'] as number) ?? 0;
  dto.repetitionScore = (raw['repetitionScore'] as number) ?? 0;
  dto.keywordCoverage = (raw['keywordCoverage'] as number) ?? 0;
  dto.confidenceScore = (raw['confidenceScore'] as number) ?? 0;
  return dto;
}

export function mapEvaluation(doc: AiEvaluationDocument | null): AiEvaluationDto | undefined {
  if (!doc) return undefined;

  const raw = doc as unknown as Record<string, unknown>;
  const dto = new AiEvaluationDto();
  dto.technicalScore = (raw['technicalScore'] as number) ?? 0;
  dto.communicationScore = (raw['communicationScore'] as number) ?? 0;
  dto.correctnessScore = (raw['correctnessScore'] as number) ?? 0;
  dto.completenessScore = (raw['completenessScore'] as number) ?? 0;
  dto.strengths = (raw['strengths'] as string[]) ?? [];
  dto.weaknesses = (raw['weaknesses'] as string[]) ?? [];
  dto.missingConcepts = (raw['missingConcepts'] as string[]) ?? [];
  dto.followUpQuestions = (raw['followUpQuestions'] as string[]) ?? [];
  dto.feedback = (raw['feedback'] as string) ?? '';
  return dto;
}

export function mapQuestionReport(
  question: QuestionDocument,
  answer: AnswerDocument | null,
  metrics: InterviewMetricsDocument | null,
  evaluation: AiEvaluationDocument | null,
): QuestionReportDto {
  const raw = question as unknown as Record<string, unknown>;
  const dto = new QuestionReportDto();
  dto.questionId = toId(raw['_id'] as Types.ObjectId);
  dto.text = (raw['text'] as string) ?? '';
  dto.type = (raw['type'] as QuestionType) ?? QuestionType.TECHNICAL;
  dto.difficulty = (raw['difficulty'] as QuestionDifficulty) ?? QuestionDifficulty.MEDIUM;
  dto.order = (raw['order'] as number) ?? 0;
  dto.targetSkills = (raw['targetSkills'] as string[]) ?? undefined;
  dto.estimatedAnswerDuration = (raw['estimatedAnswerDuration'] as number) ?? undefined;

  if (answer) {
    const answerRaw = answer as unknown as Record<string, unknown>;
    dto.transcript = (answerRaw['transcript'] as string) ?? undefined;
    dto.durationSeconds = (answerRaw['durationSeconds'] as number) ?? undefined;
  }

  const mappedMetrics = mapMetrics(metrics);
  if (mappedMetrics) {
    dto.metrics = mappedMetrics;
  }

  const mappedEvaluation = mapEvaluation(evaluation);
  if (mappedEvaluation) {
    dto.evaluation = mappedEvaluation;
  }

  return dto;
}

export function mapInterviewSummary(doc: InterviewDocument): InterviewSummaryDto {
  const dto = new InterviewSummaryDto();
  dto.id = toId(doc._id);
  dto.userId = toId(doc.userId);
  dto.mode = doc.mode;
  dto.status = doc.status;
  dto.title = doc.title ?? '';
  dto.estimatedDuration = doc.estimatedDuration ?? 0;
  dto.totalQuestions = doc.totalQuestions ?? 0;
  dto.overallScore = doc.overallScore ?? 0;
  dto.communicationScore = doc.communicationScore ?? 0;
  dto.technicalScore = doc.technicalScore ?? 0;
  dto.confidenceScore = doc.confidenceScore ?? 0;
  dto.startedAt = doc.startedAt ?? undefined;
  dto.completedAt = doc.completedAt ?? undefined;
  dto.createdAt = doc.createdAt ?? new Date();
  return dto;
}

export function buildReport(
  interview: InterviewDocument,
  questions: QuestionDocument[],
  answersByQuestionId: Map<string, AnswerDocument>,
  metricsByAnswerId: Map<string, InterviewMetricsDocument>,
  evaluationsByAnswerId: Map<string, AiEvaluationDocument>,
): InterviewReportDto {
  const questionReports = questions.map((q) => {
    const raw = q as unknown as Record<string, unknown>;
    const qId = toId(raw['_id'] as Types.ObjectId);
    const answer = answersByQuestionId.get(qId) ?? null;
    let metrics: InterviewMetricsDocument | null = null;
    let evaluation: AiEvaluationDocument | null = null;

    if (answer) {
      const answerRaw = answer as unknown as Record<string, unknown>;
      const aId = toId(answerRaw['_id'] as Types.ObjectId);
      metrics = metricsByAnswerId.get(aId) ?? null;
      evaluation = evaluationsByAnswerId.get(aId) ?? null;
    }

    return mapQuestionReport(q, answer, metrics, evaluation);
  });

  const totalAnswered = questionReports.filter((qr) => qr.transcript).length;
  const durationMinutes =
    questionReports.reduce((sum, qr) => sum + (qr.durationSeconds ?? 0), 0) / 60;

  const report = new InterviewReportDto();
  report.interview = mapInterviewSummary(interview);
  report.questions = questionReports;
  report.totalAnswered = totalAnswered;
  report.totalQuestions = questions.length;
  report.durationMinutes = Math.round(durationMinutes * 10) / 10;
  return report;
}
