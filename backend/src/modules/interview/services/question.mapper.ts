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
  expectedKeywords?: string[];
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
  expectedKeywords: string[];
}

const REQUIRED_FIELDS: (keyof AiInterviewResponse)[] = ['title', 'estimatedDuration', 'questions'];

const VALID_QUESTION_TYPES = new Set<string>(Object.values(QuestionType));
const VALID_DIFFICULTIES = new Set<string>(Object.values(QuestionDifficulty));

function parseJsonFromAiResponse(raw: string): AiInterviewResponse {
  _logger.log(`[parseJsonFromAiResponse] Input length: ${raw.length}ch`);

  let cleaned = raw.trim();

  const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    _logger.log('[parseJsonFromAiResponse] Extracted from markdown code block');
    cleaned = codeBlockMatch[1].trim();
  }

  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    _logger.error(
      `[parseJsonFromAiResponse] No JSON object found. jsonStart=${jsonStart}, jsonEnd=${jsonEnd}. First 500ch: "${cleaned.substring(0, 500)}"`,
    );
    AppException.throw(INTERVIEW_ERRORS.INVALID_AI_RESPONSE);
  }

  cleaned = cleaned.substring(jsonStart, jsonEnd + 1);

  try {
    return JSON.parse(cleaned) as AiInterviewResponse;
  } catch (parseError) {
    _logger.error(
      `[parseJsonFromAiResponse] JSON.parse failed: ${(parseError as Error).message}. Attempting recovery. Extracted JSON (${cleaned.length}ch):\n${cleaned}`,
    );

    const recovered = _tryRecoverTruncatedJson(cleaned);
    if (recovered) {
      _logger.log('[parseJsonFromAiResponse] Recovered truncated JSON successfully');
      return recovered;
    }

    AppException.throw(INTERVIEW_ERRORS.INVALID_AI_RESPONSE);
    throw new UnreachableError('unreachable');
  }
}

function _tryRecoverTruncatedJson(text: string): AiInterviewResponse | null {
  let candidate = text;

  const openBrackets = (candidate.match(/\[/g) || []).length;
  const closeBrackets = (candidate.match(/\]/g) || []).length;
  const openBraces = (candidate.match(/\{/g) || []).length;
  const closeBraces = (candidate.match(/\}/g) || []).length;

  let suffix = '';
  for (let i = closeBrackets; i < openBrackets; i++) suffix += ']';
  for (let i = closeBraces; i < openBraces; i++) suffix += '}';

  if (suffix.length > 0) {
    candidate = candidate.replace(/,\s*$/, '') + suffix;
    try {
      const parsed = JSON.parse(candidate) as AiInterviewResponse;
      if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        return parsed;
      }
    } catch {
      // recovery failed
    }
  }

  return null;
}

function validateResponse(data: AiInterviewResponse, expectedCount: number): void {
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

  if (data.questions.length !== expectedCount) {
    _logger.warn(
      `[validateResponse] Expected ${expectedCount} questions but received ${data.questions.length}`,
    );
    AppException.throw(INTERVIEW_ERRORS.WRONG_QUESTION_COUNT);
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

export function mapAiResponseToQuestions(
  raw: string,
  expectedCount: number = 5,
): AiInterviewResponse & { questions: MappedQuestion[] } {
  const data = parseJsonFromAiResponse(raw);
  validateResponse(data, expectedCount);

  const questions: MappedQuestion[] = data.questions.map((q, i) => {
    validateQuestion(q, i);
    return {
      order: q.order,
      type: q.type as QuestionType,
      difficulty: q.difficulty as QuestionDifficulty,
      text: q.text.trim(),
      expectedKeywords: Array.isArray(q.expectedKeywords) ? q.expectedKeywords : [],
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
