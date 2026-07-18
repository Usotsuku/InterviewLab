import { IAppException } from '@core/exceptions/app.exception';

export const AUTH_ERRORS = {
  USER_ALREADY_EXISTS: {
    message: 'USER_ALREADY_EXISTS',
    statusCode: 409,
    description: 'A user account is already registered with this email address.',
  },
  INVALID_CREDENTIALS: {
    message: 'INVALID_CREDENTIALS',
    statusCode: 401,
    description: 'Email or password is incorrect.',
  },
  INVALID_REFRESH_TOKEN: {
    message: 'INVALID_REFRESH_TOKEN',
    statusCode: 401,
    description: 'The refresh token is invalid or does not match any active session.',
  },
  EXPIRED_REFRESH_TOKEN: {
    message: 'EXPIRED_REFRESH_TOKEN',
    statusCode: 401,
    description: 'The refresh token has expired. Please log in again.',
  },
  INACTIVE_SESSION: {
    message: 'INACTIVE_SESSION',
    statusCode: 401,
    description: 'The session has been revoked or is no longer active.',
  },
  SESSION_REVOKED: {
    message: 'SESSION_REVOKED',
    statusCode: 401,
    description: 'The session token was revoked.',
  },
  USER_NOT_FOUND: {
    message: 'USER_NOT_FOUND',
    statusCode: 404,
    description: 'The requested user account does not exist.',
  },
} as const satisfies Record<string, IAppException>;
