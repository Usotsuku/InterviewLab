import { IAppException } from './app.exception';

export const CORE_ERRORS = {
  INTERNAL_SERVER_ERROR: {
    message: 'INTERNAL_SERVER_ERROR',
    statusCode: 500,
    description: 'An unexpected error occurred on the server.',
  },
  DATABASE_ERROR: {
    message: 'DATABASE_ERROR',
    statusCode: 500,
    description: 'A database operation failed.',
  },
  VALIDATION_ERROR: {
    message: 'VALIDATION_ERROR',
    statusCode: 400,
    description: 'Request inputs failed validation rules.',
  },
  UNAUTHORIZED: {
    message: 'UNAUTHORIZED_ACCESS',
    statusCode: 401,
    description: 'Invalid credentials or missing tokens.',
  },
  FORBIDDEN: {
    message: 'INSUFFICIENT_PERMISSIONS',
    statusCode: 403,
    description: 'You do not have permission to execute this operation.',
  },
  NOT_FOUND: {
    message: 'RESOURCE_NOT_FOUND',
    statusCode: 404,
    description: 'The requested resource does not exist.',
  },
  RATE_LIMIT_EXCEEDED: {
    message: 'RATE_LIMIT_EXCEEDED',
    statusCode: 429,
    description: 'Too many requests. Please try again later.',
  },
} as const satisfies Record<string, IAppException>;
