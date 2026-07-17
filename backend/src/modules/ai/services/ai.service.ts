import { Injectable, Logger } from '@nestjs/common';

interface CvAnalysisResult {
  summary: string;
  skills: string[];
  technologies: string[];
  strengths: string[];
  weaknesses: string[];
}

interface QuestionGenerationResult {
  id: string;
  text: string;
  type: string;
}

interface AnswerEvaluationResult {
  technicalScore: number;
  semanticScore: number;
  missingConcepts: string[];
  communicationTips: string[];
  idealAnswer: string;
}

export interface IAIProvider {
  analyzeCv(cvText: string): Promise<CvAnalysisResult>;
  generateQuestions(profileSummary: string, mode: string, count: number): Promise<QuestionGenerationResult[]>;
  evaluateAnswer(question: string, transcript: string): Promise<AnswerEvaluationResult>;
}

@Injectable()
export class AIService {
  private readonly _logger = new Logger(AIService.name);

  async analyzeCv(_cvText: string): Promise<CvAnalysisResult> {
    this._logger.log('[analyzeCv] Initiating CV extraction parsing');
    return {
      summary: 'TODO: summary background',
      skills: [],
      technologies: [],
      strengths: [],
      weaknesses: [],
    };
  }

  async generateQuestions(_profileSummary: string, _mode: string, _count: number): Promise<QuestionGenerationResult[]> {
    this._logger.log(`[generateQuestions] Generating ${_count} questions for mode: ${_mode}`);
    return [];
  }

  async evaluateAnswer(_question: string, _transcript: string, _sessionId?: string): Promise<AnswerEvaluationResult> {
    this._logger.log('[evaluateAnswer] Evaluating candidate speech transcript');
    return {
      technicalScore: 85,
      semanticScore: 80,
      missingConcepts: [],
      communicationTips: [],
      idealAnswer: 'TODO: ideal answer text',
    };
  }
}
