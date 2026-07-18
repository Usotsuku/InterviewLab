import { IAppException } from '@core/exceptions/app.exception';

export const CANDIDATE_PROFILE_ERRORS = {
  PROFILE_NOT_FOUND: {
    message: 'CANDIDATE_PROFILE_NOT_FOUND',
    statusCode: 404,
    description: 'No candidate profile found for this user.',
  },
  PROFILE_ALREADY_EXISTS: {
    message: 'CANDIDATE_PROFILE_ALREADY_EXISTS',
    statusCode: 409,
    description: 'A candidate profile already exists for this user.',
  },
} as const satisfies Record<string, IAppException>;
