import { AI_ERRORS } from '../errors/ai.errors';
import { AppException } from '@core/exceptions/app.exception';

const SCORE_MIN = 0;
const SCORE_MAX = 100;

export interface AiEvaluationInput {
  answerId: string;
  interviewId: string;
  rawAiResponse: string;
  promptUsed: string;
  tokensUsed?: number;
  evaluationDurationMs?: number;
  provider?: string;
}

export interface AiEvaluationOutput {
  answerId: string;
  interviewId: string;
  technicalScore: number;
  communicationScore: number;
  correctnessScore: number;
  completenessScore: number;
  strengths: string[];
  weaknesses: string[];
  missingConcepts: string[];
  followUpQuestions: string[];
  feedback: string;
  promptUsed: string;
  rawAiResponse: string;
  tokensUsed: number;
  evaluationDurationMs: number;
  provider: string;
}

interface RawEvaluationResponse {
  technicalScore?: unknown;
  communicationScore?: unknown;
  correctnessScore?: unknown;
  completenessScore?: unknown;
  strengths?: unknown;
  weaknesses?: unknown;
  missingConcepts?: unknown;
  followUpQuestions?: unknown;
  feedback?: unknown;
}

function isNumberInRange(value: unknown): value is number {
  return (
    typeof value === 'number' && !Number.isNaN(value) && value >= SCORE_MIN && value <= SCORE_MAX
  );
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function extractJsonFromResponse(raw: string): Record<string, unknown> {
  let cleaned = raw.trim();

  const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    AppException.throw(AI_ERRORS.INVALID_RESPONSE, {
      reason: 'No JSON object found in AI response',
    });
  }

  try {
    return JSON.parse(jsonMatch![0]) as Record<string, unknown>;
  } catch {
    AppException.throw(AI_ERRORS.INVALID_RESPONSE, {
      reason: 'Failed to parse JSON from AI response',
    });
  }
}

function validateAndClampScore(value: unknown, fieldName: string, fallback: number): number {
  if (isNumberInRange(value)) {
    return Math.round(value);
  }
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return Math.round(Math.max(SCORE_MIN, Math.min(SCORE_MAX, value)));
  }
  return fallback;
}

export function parseAndValidate(input: AiEvaluationInput): AiEvaluationOutput {
  const parsed = extractJsonFromResponse(input.rawAiResponse);

  const raw = parsed as RawEvaluationResponse;

  const technicalScore = validateAndClampScore(raw.technicalScore, 'technicalScore', 0);
  const communicationScore = validateAndClampScore(raw.communicationScore, 'communicationScore', 0);
  const correctnessScore = validateAndClampScore(raw.correctnessScore, 'correctnessScore', 0);
  const completenessScore = validateAndClampScore(raw.completenessScore, 'completenessScore', 0);

  return {
    answerId: input.answerId,
    interviewId: input.interviewId,
    technicalScore,
    communicationScore,
    correctnessScore,
    completenessScore,
    strengths: toStringArray(raw.strengths),
    weaknesses: toStringArray(raw.weaknesses),
    missingConcepts: toStringArray(raw.missingConcepts),
    followUpQuestions: toStringArray(raw.followUpQuestions),
    feedback: typeof raw.feedback === 'string' ? raw.feedback : '',
    promptUsed: input.promptUsed,
    rawAiResponse: input.rawAiResponse,
    tokensUsed: typeof input.tokensUsed === 'number' ? input.tokensUsed : 0,
    evaluationDurationMs:
      typeof input.evaluationDurationMs === 'number' ? input.evaluationDurationMs : 0,
    provider: typeof input.provider === 'string' ? input.provider : '',
  };
}
