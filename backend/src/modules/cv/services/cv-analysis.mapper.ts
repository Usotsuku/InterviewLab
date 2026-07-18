import { AppException } from '@core/exceptions/app.exception';
import { CV_ERRORS } from '../errors/cv.errors';
import { Logger } from '@nestjs/common';

export interface AiCvAnalysisResponse {
  summary: string;
  skills: string[];
  technologies: string[];
  strengths: string[];
  weaknesses: string[];
  experience: {
    company: string;
    position: string;
    startDate: string;
    endDate: string | null;
    description: string;
  }[];
  projects: {
    name: string;
    description: string;
    technologies: string[];
    url: string | null;
  }[];
}

export interface MappedProfile {
  summary: string;
  skills: string[];
  technologies: string[];
  strengths: string[];
  weaknesses: string[];
  experience: {
    company: string;
    position: string;
    startDate: Date;
    endDate?: Date;
    description?: string;
  }[];
  projects: {
    name: string;
    description?: string;
    technologies: string[];
    url?: string;
  }[];
}

const _logger = new Logger('CvAnalysisMapper');

const REQUIRED_FIELDS: (keyof AiCvAnalysisResponse)[] = [
  'summary',
  'skills',
  'technologies',
  'strengths',
  'weaknesses',
];

function parseJsonFromAiResponse(raw: string): AiCvAnalysisResponse {
  let cleaned = raw.trim();

  const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }

  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    AppException.throw(CV_ERRORS.INVALID_AI_RESPONSE);
  }

  cleaned = cleaned.substring(jsonStart, jsonEnd + 1);

  try {
    return JSON.parse(cleaned) as AiCvAnalysisResponse;
  } catch {
    AppException.throw(CV_ERRORS.INVALID_AI_RESPONSE);
    throw new unreachable('unreachable');
  }
}

function validateResponse(data: AiCvAnalysisResponse): void {
  for (const field of REQUIRED_FIELDS) {
    if (data[field] === undefined || data[field] === null) {
      _logger.warn(`[validateResponse] Missing required field: ${field}`);
      AppException.throw(CV_ERRORS.INVALID_AI_RESPONSE);
    }
  }

  if (!Array.isArray(data.skills)) {
    _logger.warn('[validateResponse] skills is not an array');
    AppException.throw(CV_ERRORS.INVALID_AI_RESPONSE);
  }

  if (!Array.isArray(data.technologies)) {
    _logger.warn('[validateResponse] technologies is not an array');
    AppException.throw(CV_ERRORS.INVALID_AI_RESPONSE);
  }

  if (!Array.isArray(data.strengths)) {
    _logger.warn('[validateResponse] strengths is not an array');
    AppException.throw(CV_ERRORS.INVALID_AI_RESPONSE);
  }

  if (!Array.isArray(data.weaknesses)) {
    _logger.warn('[validateResponse] weaknesses is not an array');
    AppException.throw(CV_ERRORS.INVALID_AI_RESPONSE);
  }
}

function parseDateSafe(dateStr: string | null | undefined): Date | undefined {
  if (!dateStr || dateStr.trim() === '') return undefined;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return undefined;
    return d;
  } catch {
    return undefined;
  }
}

function mapExperience(data: AiCvAnalysisResponse): MappedProfile['experience'] {
  if (!data.experience || !Array.isArray(data.experience)) return [];

  return data.experience.map((entry) => ({
    company: String(entry.company ?? 'Unknown'),
    position: String(entry.position ?? 'Unknown'),
    startDate: parseDateSafe(entry.startDate) ?? new Date(),
    endDate: parseDateSafe(entry.endDate) ?? undefined,
    description: entry.description ?? undefined,
  }));
}

function mapProjects(data: AiCvAnalysisResponse): MappedProfile['projects'] {
  if (!data.projects || !Array.isArray(data.projects)) return [];

  return data.projects.map((entry) => ({
    name: String(entry.name ?? 'Unknown'),
    description: entry.description ?? undefined,
    technologies: Array.isArray(entry.technologies) ? entry.technologies.map(String) : [],
    url: entry.url ?? undefined,
  }));
}

function mapToStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter((item) => item.length > 0);
}

export function mapAiResponseToProfile(raw: string): MappedProfile {
  const data = parseJsonFromAiResponse(raw);
  validateResponse(data);

  _logger.log(`[mapAiResponseToProfile] Mapping ${data.skills.length} skills, ${data.technologies.length} technologies`);

  return {
    summary: String(data.summary),
    skills: mapToStringArray(data.skills),
    technologies: mapToStringArray(data.technologies),
    strengths: mapToStringArray(data.strengths),
    weaknesses: mapToStringArray(data.weaknesses),
    experience: mapExperience(data),
    projects: mapProjects(data),
  };
}

class unreachable extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'unreachable';
  }
}
