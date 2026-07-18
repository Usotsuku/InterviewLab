import { IAppException } from '@core/exceptions/app.exception';

export const AI_ERRORS = {
  PROVIDER_UNAVAILABLE: {
    message: 'AI_PROVIDER_UNAVAILABLE',
    statusCode: 503,
    description: 'The AI provider is currently unavailable.',
  },
  REQUEST_TIMEOUT: {
    message: 'AI_REQUEST_TIMEOUT',
    statusCode: 504,
    description: 'The AI request exceeded the configured timeout.',
  },
  AUTHENTICATION_FAILED: {
    message: 'AI_AUTHENTICATION_FAILED',
    statusCode: 401,
    description: 'AI provider authentication failed. Check API key configuration.',
  },
  RATE_LIMIT_EXCEEDED: {
    message: 'AI_RATE_LIMIT_EXCEEDED',
    statusCode: 429,
    description: 'AI provider rate limit exceeded. Please try again later.',
  },
  INVALID_RESPONSE: {
    message: 'AI_INVALID_RESPONSE',
    statusCode: 502,
    description: 'The AI provider returned an invalid or unexpected response.',
  },
} as const satisfies Record<string, IAppException>;
