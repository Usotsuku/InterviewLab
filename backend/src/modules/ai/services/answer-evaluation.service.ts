import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { AIService } from '../services/ai.service';
import { PromptService } from '../services/prompt.service';
import { AiEvaluationRepository } from '../repositories/ai-evaluation.repository';
import { AnswerRepository } from '@modules/answer/repositories/answer.repository';
import { QuestionRepository } from '@modules/question/repositories/question.repository';
import { CandidateProfileRepository } from '@modules/candidate-profile/repositories/candidate-profile.repository';
import { InterviewMetricsRepository } from '@modules/metrics/repositories/interview-metrics.repository';
import { InterviewRepository } from '@modules/interview/repositories/interview.repository';
import { parseAndValidate, AiEvaluationOutput } from '../mappers/evaluation.mapper';

export interface EvaluateAnswerInput {
  answerId: string;
}

interface AnswerDocument {
  _id: Types.ObjectId;
  interviewId: Types.ObjectId;
  questionId: Types.ObjectId;
  transcript: string;
  audioUrl: string | null;
  durationSeconds: number;
}

interface QuestionDocument {
  _id: Types.ObjectId;
  text: string;
  type: string;
  difficulty: string;
  expectedKeywords: string[];
}

interface InterviewDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
}

interface CandidateProfileDocument {
  userId: Types.ObjectId;
  summary: string;
  skills: string[];
  technologies: string[];
}

interface MetricsDocument {
  wordsPerMinute: number;
  confidenceScore: number;
  vocabularyRichness: number;
  keywordCoverage: number;
  fillerCount: number;
  repetitionScore: number;
}

@Injectable()
export class AnswerEvaluationService {
  private readonly _logger = new Logger(AnswerEvaluationService.name);

  constructor(
    private readonly _aiService: AIService,
    private readonly _promptService: PromptService,
    private readonly _evaluationRepository: AiEvaluationRepository,
    private readonly _answerRepository: AnswerRepository,
    private readonly _questionRepository: QuestionRepository,
    private readonly _interviewRepository: InterviewRepository,
    private readonly _candidateProfileRepository: CandidateProfileRepository,
    private readonly _metricsRepository: InterviewMetricsRepository,
  ) {}

  async evaluate(input: EvaluateAnswerInput): Promise<AiEvaluationOutput> {
    const startTime = Date.now();
    this._logger.log(`[evaluate] Starting evaluation for answer: ${input.answerId}`);

    const answerDoc = await this._answerRepository.findById(input.answerId) as unknown as AnswerDocument | null;
    if (!answerDoc) {
      this._logger.error(`[evaluate] Answer not found: ${input.answerId}`);
      throw new Error(`Answer not found: ${input.answerId}`);
    }

    const interviewIdStr = answerDoc.interviewId.toString();
    const questionIdStr = answerDoc.questionId.toString();

    const [questionDoc, interviewDoc, metricsDoc] = await Promise.all([
      this._questionRepository.findById(questionIdStr),
      this._interviewRepository.findById(interviewIdStr),
      this._metricsRepository.findByAnswerId(input.answerId),
    ]) as [QuestionDocument | null, InterviewDocument | null, MetricsDocument | null];

    let candidateProfileDoc: CandidateProfileDocument | null = null;
    if (interviewDoc) {
      candidateProfileDoc = (await this._candidateProfileRepository.findByUserId(
        interviewDoc.userId.toString(),
      )) as unknown as CandidateProfileDocument | null;
    }

    const questionText = questionDoc?.text ?? 'Unknown question';
    const questionType = questionDoc?.type ?? 'UNKNOWN';
    const questionDifficulty = questionDoc?.difficulty ?? 'MEDIUM';
    const expectedKeywords = questionDoc?.expectedKeywords ?? [];

    const candidateSummary = this._buildCandidateSummary(candidateProfileDoc);

    const metrics = {
      wordsPerMinute: metricsDoc?.wordsPerMinute,
      confidenceScore: metricsDoc?.confidenceScore,
      vocabularyRichness: metricsDoc?.vocabularyRichness,
      keywordCoverage: metricsDoc?.keywordCoverage,
      fillerCount: metricsDoc?.fillerCount,
      repetitionScore: metricsDoc?.repetitionScore,
    };

    const promptPayload = this._promptService.buildAnswerEvaluationPrompt(
      questionText,
      questionType,
      questionDifficulty,
      expectedKeywords,
      answerDoc.transcript ?? '',
      candidateSummary,
      metrics,
    );

    const aiResponse = await this._aiService.generate({
      prompt: promptPayload.prompt,
      systemInstruction: promptPayload.systemInstruction,
    });

    const evaluationDurationMs = Date.now() - startTime;

    const output = parseAndValidate({
      answerId: input.answerId,
      interviewId: interviewIdStr,
      rawAiResponse: aiResponse.text,
      promptUsed: promptPayload.prompt,
      tokensUsed: aiResponse.tokenUsage.input + aiResponse.tokenUsage.output,
      evaluationDurationMs,
      provider: aiResponse.provider,
    });

    await this._evaluationRepository.create({
      answerId: new Types.ObjectId(output.answerId),
      interviewId: new Types.ObjectId(output.interviewId),
      technicalScore: output.technicalScore,
      communicationScore: output.communicationScore,
      correctnessScore: output.correctnessScore,
      completenessScore: output.completenessScore,
      strengths: output.strengths,
      weaknesses: output.weaknesses,
      missingConcepts: output.missingConcepts,
      followUpQuestions: output.followUpQuestions,
      feedback: output.feedback,
      promptUsed: output.promptUsed,
      rawAiResponse: output.rawAiResponse,
      tokensUsed: output.tokensUsed,
      evaluationDurationMs: output.evaluationDurationMs,
      provider: output.provider,
    });

    this._logger.log(
      `[evaluate] Evaluation completed for answer: ${input.answerId}, technical: ${output.technicalScore}, communication: ${output.communicationScore}, duration: ${evaluationDurationMs}ms`,
    );

    return output;
  }

  private _buildCandidateSummary(profile: CandidateProfileDocument | null): string {
    if (!profile) {
      return '';
    }

    const parts: string[] = [];

    if (profile.summary) {
      parts.push(profile.summary);
    }
    if (profile.skills?.length > 0) {
      parts.push(`Skills: ${profile.skills.join(', ')}`);
    }
    if (profile.technologies?.length > 0) {
      parts.push(`Technologies: ${profile.technologies.join(', ')}`);
    }

    return parts.join('\n');
  }
}
