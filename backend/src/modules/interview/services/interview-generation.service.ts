import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { AIService } from '@modules/ai/services/ai.service';
import { PromptService } from '@modules/ai/services/prompt.service';
import { CandidateProfileService } from '@modules/candidate-profile/services/candidate-profile.service';
import { InterviewRepository } from '../repositories/interview.repository';
import { QuestionRepository } from '@modules/question/repositories/question.repository';
import { mapAiResponseToQuestions } from './question.mapper';
import { INTERVIEW_ERRORS } from '../errors/interview.errors';
import { AppException } from '@core/exceptions/app.exception';
import { InterviewStatus, QuestionType, QuestionDifficulty } from '@shared/enums/domain.enums';

export interface GenerationResult {
  interviewId: string;
  status: InterviewStatus;
  title: string;
  estimatedDuration: number;
  totalQuestions: number;
}

@Injectable()
export class InterviewGenerationService {
  private readonly _logger = new Logger(InterviewGenerationService.name);

  constructor(
    private readonly _aiService: AIService,
    private readonly _promptService: PromptService,
    private readonly _candidateProfileService: CandidateProfileService,
    private readonly _interviewRepo: InterviewRepository,
    private readonly _questionRepo: QuestionRepository,
  ) {}

  async generate(userId: string, interviewId: string, mode: string): Promise<GenerationResult> {
    this._logger.log(`[generate] Starting interview generation for user: ${userId}, mode: ${mode}`);

    const profile = await this._candidateProfileService.findByUserId(userId).catch(() => null);
    if (!profile) {
      AppException.throw(INTERVIEW_ERRORS.PROFILE_NOT_FOUND);
    }

    if (profile.completionPercent < 20) {
      AppException.throw(INTERVIEW_ERRORS.PROFILE_INCOMPLETE);
    }

    await this._updateStatus(interviewId, InterviewStatus.GENERATING);

    try {
      const profileSummary = this._buildProfileSummary(profile);
      const payload = this._promptService.buildInterviewPrompt(profileSummary, mode, 10);

      this._logger.log(`[generate] Calling AI for interview generation`);

      const response = await this._aiService.generate({
        prompt: payload.prompt,
        systemInstruction: payload.systemInstruction,
      });

      const mapped = mapAiResponseToQuestions(response.text);

      await this._updateStatus(interviewId, InterviewStatus.READY);

      await this._interviewRepo.updateById(interviewId, {
        title: mapped.title,
        estimatedDuration: mapped.estimatedDuration,
        totalQuestions: mapped.questions.length,
      });

      const questionDocs = mapped.questions.map((q) => ({
        interviewId: new Types.ObjectId(interviewId),
        text: q.text,
        type: q.type as QuestionType,
        difficulty: q.difficulty as QuestionDifficulty,
        order: q.order,
      }));

      for (const doc of questionDocs) {
        await this._questionRepo.create(doc);
      }

      const verifyDocs = await this._questionRepo.findByInterviewId(interviewId);
      this._logger.log(
        `[generate] Persisted ${questionDocs.length} question docs, re-queried ${verifyDocs.length} for interview ${interviewId}`,
      );

      this._logger.log(
        `[generate] Interview generated: ${mapped.questions.length} questions, title: "${mapped.title}"`,
      );

      return {
        interviewId,
        status: InterviewStatus.READY,
        title: mapped.title,
        estimatedDuration: mapped.estimatedDuration,
        totalQuestions: mapped.questions.length,
      };
    } catch (error) {
      if (error instanceof AppException) {
        this._logger.error(
          `[generate] Generation failed for interview: ${interviewId}: ${error.message}`,
        );
        await this._updateStatus(interviewId, InterviewStatus.FAILED);
        throw error;
      }

      this._logger.error(
        `[generate] Unexpected error for interview: ${interviewId}: ${String(error)}`,
      );
      await this._updateStatus(interviewId, InterviewStatus.FAILED);
      AppException.throw(INTERVIEW_ERRORS.GENERATION_FAILED);
    }
  }

  private _buildProfileSummary(profile: {
    summary: string;
    skills: string[];
    technologies: string[];
    experience: { company: string; position: string; description?: string }[];
    projects: { name: string; description?: string; technologies: string[] }[];
    strengths: string[];
    weaknesses: string[];
  }): string {
    const parts: string[] = [];

    if (profile.summary) {
      parts.push(`Summary: ${profile.summary}`);
    }
    if (profile.skills.length > 0) {
      parts.push(`Skills: ${profile.skills.join(', ')}`);
    }
    if (profile.technologies.length > 0) {
      parts.push(`Technologies: ${profile.technologies.join(', ')}`);
    }
    if (profile.experience.length > 0) {
      const expStr = profile.experience
        .map((e) => `${e.position}${e.description ? ` - ${e.description}` : ''}`)
        .join('; ');
      parts.push(`Experience: ${expStr}`);
    }
    if (profile.projects.length > 0) {
      const projStr = profile.projects
        .map((p) => `${p.name}${p.description ? ` - ${p.description}` : ''}`)
        .join('; ');
      parts.push(`Projects: ${projStr}`);
    }
    if (profile.strengths.length > 0) {
      parts.push(`Strengths: ${profile.strengths.join(', ')}`);
    }
    if (profile.weaknesses.length > 0) {
      parts.push(`Weaknesses: ${profile.weaknesses.join(', ')}`);
    }

    return parts.join('\n');
  }

  private async _updateStatus(interviewId: string, status: InterviewStatus): Promise<void> {
    await this._interviewRepo.updateById(interviewId, { status });
  }
}
