import { IAppException } from '@core/exceptions/app.exception';

export const INTERVIEW_ERRORS = {
  PROFILE_NOT_FOUND: {
    message: 'PROFILE_NOT_FOUND',
    statusCode: 404,
    description: 'Candidate profile not found. Upload a CV first.',
  },
  PROFILE_INCOMPLETE: {
    message: 'PROFILE_INCOMPLETE',
    statusCode: 400,
    description: 'Candidate profile is incomplete. Complete your profile before generating an interview.',
  },
  GENERATION_FAILED: {
    message: 'GENERATION_FAILED',
    statusCode: 500,
    description: 'Interview generation failed due to an internal error.',
  },
  INVALID_AI_RESPONSE: {
    message: 'INVALID_AI_RESPONSE',
    statusCode: 502,
    description: 'The AI provider returned an invalid or unparseable response.',
  },
  INTERVIEW_NOT_FOUND: {
    message: 'INTERVIEW_NOT_FOUND',
    statusCode: 404,
    description: 'Interview not found.',
  },
  INVALID_STATUS_TRANSITION: {
    message: 'INVALID_STATUS_TRANSITION',
    statusCode: 409,
    description: 'Cannot transition from current status to the requested status.',
  },
  INTERVIEW_NOT_READY: {
    message: 'INTERVIEW_NOT_READY',
    statusCode: 400,
    description: 'Interview is not ready to start. Wait for question generation to complete.',
  },
  INTERVIEW_NOT_IN_PROGRESS: {
    message: 'INTERVIEW_NOT_IN_PROGRESS',
    statusCode: 400,
    description: 'Interview is not in progress.',
  },
  NO_QUESTIONS: {
    message: 'NO_QUESTIONS',
    statusCode: 500,
    description: 'No questions were generated for this interview.',
  },
  QUESTION_NOT_FOUND: {
    message: 'QUESTION_NOT_FOUND',
    statusCode: 404,
    description: 'Question not found for this interview.',
  },
  ALL_QUESTIONS_ANSWERED: {
    message: 'ALL_QUESTIONS_ANSWERED',
    statusCode: 400,
    description: 'All questions have been answered. Finish the interview.',
  },
} as const satisfies Record<string, IAppException>;
