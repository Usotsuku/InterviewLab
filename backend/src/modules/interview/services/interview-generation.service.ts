import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { AIService } from '@modules/ai/services/ai.service';
import { PromptService } from '@modules/ai/services/prompt.service';
import { RetryService } from '@modules/ai/services/retry.service';
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
    private readonly _retryService: RetryService,
    private readonly _candidateProfileService: CandidateProfileService,
    private readonly _interviewRepo: InterviewRepository,
    private readonly _questionRepo: QuestionRepository,
  ) {}

  async generate(
    userId: string,
    interviewId: string,
    mode: string,
    questionCount: number = 5,
  ): Promise<GenerationResult> {
    this._logger.log(
      `[generate] Starting interview generation for user: ${userId}, mode: ${mode}, questionCount: ${questionCount}`,
    );

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
      const payload = this._promptService.buildInterviewPrompt(
        profileSummary,
        mode,
        questionCount,
      );

      const sysLen = payload.systemInstruction?.length ?? 0;
      const promptLen = payload.prompt.length;
      this._logger.log(
        `[generate] Payload breakdown: systemInstruction=${sysLen}ch (~${Math.ceil(sysLen / 4)} tok), prompt=${promptLen}ch (~${Math.ceil(promptLen / 4)} tok), total=${sysLen + promptLen}ch (~${Math.ceil((sysLen + promptLen) / 4)} tok)`,
      );

      this._logger.log(`[generate] Calling AI for interview generation`);

      const response = await this._retryService.execute(
        () =>
          this._aiService.generate({
            prompt: payload.prompt,
            systemInstruction: payload.systemInstruction,
            maxOutputTokens: 1200 + questionCount * 40,
          }),
        {
          maxAttempts: 3,
          baseDelayMs: 1000,
          maxDelayMs: 5000,
          operationName: 'interview-generation',
        },
      );

      this._logger.log(
        `[generate] AI response: ${response.text.length}ch, tokens: ${response.tokenUsage.input}+${response.tokenUsage.output}, provider: ${response.provider}, model: ${response.model}`,
      );

      if (response.text.length < 10) {
        this._logger.error(
          `[generate] AI response too short (${response.text.length}ch): "${response.text}"`,
        );
      }

      this._logger.debug(`[generate] Raw AI response:\n${response.text}`);

      const mapped = mapAiResponseToQuestions(response.text, questionCount);

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
        expectedKeywords: q.expectedKeywords ?? [],
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
    const fieldSizes: Record<string, number> = {};
    const parts: string[] = [];

    if (profile.summary) {
      fieldSizes['summary'] = profile.summary.length;
      parts.push(`Summary: ${profile.summary}`);
    }
    if (profile.skills.length > 0) {
      const skillsStr = profile.skills.join(', ');
      fieldSizes['skills'] = skillsStr.length;
      parts.push(`Skills: ${skillsStr}`);
    }
    if (profile.technologies.length > 0) {
      const techsStr = profile.technologies.join(', ');
      fieldSizes['technologies'] = techsStr.length;
      parts.push(`Technologies: ${techsStr}`);
    }
    if (profile.experience.length > 0) {
      const expEntries = profile.experience.map((e, i) => {
        const desc = e.description || '';
        fieldSizes[`experience[${i}].description`] = desc.length;
        return `${e.position}${desc ? ` - ${desc}` : ''}`;
      });
      const expStr = expEntries.join('; ');
      fieldSizes['experience_total'] = expStr.length;
      parts.push(`Experience: ${expStr}`);
    }
    if (profile.projects.length > 0) {
      const projEntries = profile.projects.map((p, i) => {
        const desc = p.description || '';
        fieldSizes[`project[${i}].description`] = desc.length;
        return `${p.name}${desc ? ` - ${desc}` : ''}`;
      });
      const projStr = projEntries.join('; ');
      fieldSizes['projects_total'] = projStr.length;
      parts.push(`Projects: ${projStr}`);
    }
    if (profile.strengths.length > 0) {
      const strengthsStr = profile.strengths.join(', ');
      fieldSizes['strengths'] = strengthsStr.length;
      parts.push(`Strengths: ${strengthsStr}`);
    }
    if (profile.weaknesses.length > 0) {
      const weaknessesStr = profile.weaknesses.join(', ');
      fieldSizes['weaknesses'] = weaknessesStr.length;
      parts.push(`Weaknesses: ${weaknessesStr}`);
    }

    const summary = parts.join('\n');
    fieldSizes['TOTAL'] = summary.length;

    this._logger.log(
      `[buildProfileSummary] Field sizes (chars): ${JSON.stringify(fieldSizes)}`,
    );
    this._logger.log(
      `[buildProfileSummary] profileSummary total: ${summary.length}ch, ~${Math.ceil(summary.length / 4)} tokens`,
    );

    return summary;
  }

  private async _updateStatus(interviewId: string, status: InterviewStatus): Promise<void> {
    await this._interviewRepo.updateById(interviewId, { status });
  }
}
