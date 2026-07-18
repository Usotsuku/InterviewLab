import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { AppException } from '@core/exceptions/app.exception';
import { INTERVIEW_ERRORS } from '../errors/interview.errors';
import { InterviewRepository } from '../repositories/interview.repository';
import { QuestionRepository } from '@modules/question/repositories/question.repository';
import { AnswerRepository } from '@modules/answer/repositories/answer.repository';
import { InterviewMetricsRepository } from '@modules/metrics/repositories/interview-metrics.repository';
import { AiEvaluationRepository } from '@modules/ai/repositories/ai-evaluation.repository';
import { buildReport } from '../mappers/interview-report.mapper';
import { InterviewReportDto } from '../dto/interview-report.dto';

@Injectable()
export class InterviewReportService {
  private readonly _logger = new Logger(InterviewReportService.name);

  constructor(
    private readonly _interviewRepo: InterviewRepository,
    private readonly _questionRepo: QuestionRepository,
    private readonly _answerRepo: AnswerRepository,
    private readonly _metricsRepo: InterviewMetricsRepository,
    private readonly _evaluationRepo: AiEvaluationRepository,
  ) {}

  async getReport(interviewId: string, userId: string): Promise<InterviewReportDto> {
    const interview = await this._interviewRepo.findById(interviewId);
    if (!interview) {
      AppException.throw(INTERVIEW_ERRORS.INTERVIEW_NOT_FOUND, { interviewId });
    }

    const raw = interview as unknown as { userId: Types.ObjectId };
    if (raw.userId.toString() !== userId) {
      AppException.throw(INTERVIEW_ERRORS.INTERVIEW_NOT_FOUND, { interviewId });
    }

    const [questions, answers, allMetrics, allEvaluations] = await Promise.all([
      this._questionRepo.findByInterviewId(interviewId),
      this._answerRepo.findByInterviewId(interviewId),
      this._metricsRepo.findByInterviewId(interviewId),
      this._evaluationRepo.findByInterviewId(interviewId),
    ]);

    const answersByQuestionId = new Map(
      answers.map((a) => {
        const raw = a as unknown as { questionId: Types.ObjectId };
        return [raw.questionId.toString(), a];
      }),
    );

    const metricsByAnswerId = new Map(
      allMetrics.map((m) => {
        const raw = m as unknown as { answerId: Types.ObjectId };
        return [raw.answerId.toString(), m];
      }),
    );

    const evaluationsByAnswerId = new Map(
      allEvaluations.map((e) => {
        const raw = e as unknown as { answerId: Types.ObjectId };
        return [raw.answerId.toString(), e];
      }),
    );

    const report = buildReport(
      interview as unknown as Parameters<typeof buildReport>[0],
      questions,
      answersByQuestionId,
      metricsByAnswerId,
      evaluationsByAnswerId,
    );

    this._logger.log(`[getReport] Report generated for interview: ${interviewId}`);

    return report;
  }
}
