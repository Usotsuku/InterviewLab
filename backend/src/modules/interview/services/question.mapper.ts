import { Logger } from '@nestjs/common';
import { AppException } from '@core/exceptions/app.exception';
import { INTERVIEW_ERRORS } from '../errors/interview.errors';
import { QuestionType, QuestionDifficulty } from '@shared/enums/domain.enums';

const _logger = new Logger('QuestionMapper');

export interface AiInterviewQuestion {
  order: number;
  type: string;
  difficulty: string;
  text: string;
}

export interface AiInterviewResponse {
  title: string;
  estimatedDuration: number;
  questions: AiInterviewQuestion[];
}

export interface MappedQuestion {
  order: number;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  text: string;
}

const REQUIRED_FIELDS: (keyof AiInterviewResponse)[] = ['title', 'estimatedDuration', 'questions'];

const VALID_QUESTION_TYPES = new Set<string>(Object.values(QuestionType));
const VALID_DIFFICULTIES = new Set<string>(Object.values(QuestionDifficulty));

function parseJsonFromAiResponse(raw: string): AiInterviewResponse {
  let cleaned = raw.trim();

  const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }

  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    AppException.throw(INTERVIEW_ERRORS.INVALID_AI_RESPONSE);
  }

  cleaned = cleaned.substring(jsonStart, jsonEnd + 1);

  try {
    return JSON.parse(cleaned) as AiInterviewResponse;
  } catch {
    AppException.throw(INTERVIEW_ERRORS.INVALID_AI_RESPONSE);
    throw new UnreachableError('unreachable');
  }
}

function validateResponse(data: AiInterviewResponse): void {
  for (const field of REQUIRED_FIELDS) {
    if (data[field] === undefined || data[field] === null) {
      _logger.warn(`[validateResponse] Missing required field: ${field}`);
      AppException.throw(INTERVIEW_ERRORS.INVALID_AI_RESPONSE);
    }
  }

  if (typeof data.title !== 'string' || data.title.trim().length === 0) {
    _logger.warn('[validateResponse] title is empty or not a string');
    AppException.throw(INTERVIEW_ERRORS.INVALID_AI_RESPONSE);
  }

  if (typeof data.estimatedDuration !== 'number' || data.estimatedDuration <= 0) {
    _logger.warn('[validateResponse] estimatedDuration is not a positive number');
    AppException.throw(INTERVIEW_ERRORS.INVALID_AI_RESPONSE);
  }

  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    _logger.warn('[validateResponse] questions is not a non-empty array');
    AppException.throw(INTERVIEW_ERRORS.INVALID_AI_RESPONSE);
  }
}

function validateQuestion(q: AiInterviewQuestion, index: number): void {
  if (typeof q.order !== 'number' || q.order < 1) {
    _logger.warn(`[validateQuestion] Question ${index}: invalid order`);
    AppException.throw(INTERVIEW_ERRORS.INVALID_AI_RESPONSE);
  }

  if (typeof q.type !== 'string' || !VALID_QUESTION_TYPES.has(q.type)) {
    _logger.warn(`[validateQuestion] Question ${index}: invalid type "${q.type}"`);
    AppException.throw(INTERVIEW_ERRORS.INVALID_AI_RESPONSE);
  }

  if (typeof q.difficulty !== 'string' || !VALID_DIFFICULTIES.has(q.difficulty)) {
    _logger.warn(`[validateQuestion] Question ${index}: invalid difficulty "${q.difficulty}"`);
    AppException.throw(INTERVIEW_ERRORS.INVALID_AI_RESPONSE);
  }

  if (typeof q.text !== 'string' || q.text.trim().length === 0) {
    _logger.warn(`[validateQuestion] Question ${index}: empty text`);
    AppException.throw(INTERVIEW_ERRORS.INVALID_AI_RESPONSE);
  }
}

export function mapAiResponseToQuestions(raw: string): AiInterviewResponse {
  const data = parseJsonFromAiResponse(raw);
  validateResponse(data);

  const questions: MappedQuestion[] = data.questions.map((q, i) => {
    validateQuestion(q, i);
    return {
      order: q.order,
      type: q.type as QuestionType,
      difficulty: q.difficulty as QuestionDifficulty,
      text: q.text.trim(),
    };
  });

  _logger.log(
    `[mapAiResponseToQuestions] Mapped ${questions.length} questions, title: "${data.title}"`,
  );

  return {
    title: data.title.trim(),
    estimatedDuration: data.estimatedDuration,
    questions,
  };
}

class UnreachableError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'UnreachableError';
  }
}
