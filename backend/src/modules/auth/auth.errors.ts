import { IAppException } from '@core/exceptions/app.exception';

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: {
    message: 'INVALID_CREDENTIALS',
    statusCode: 401,
    description: 'Username or password comparison failed.',
  },
  EMAIL_ALREADY_EXISTS: {
    message: 'EMAIL_ALREADY_EXISTS',
    statusCode: 409,
    description: 'A user account is already registered with this email address.',
  },
  SESSION_REVOKED: {
    message: 'SESSION_REVOKED',
    statusCode: 401,
    description: 'The session token was revoked.',
  },
} as const satisfies Record<string, IAppException>;
