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
  INVALID_MODEL: {
    message: 'AI_INVALID_MODEL',
    statusCode: 404,
    description: 'The configured AI model does not exist or does not support generateContent.',
  },
  QUOTA_EXCEEDED: {
    message: 'AI_QUOTA_EXCEEDED',
    statusCode: 429,
    description: 'The AI provider quota has been exhausted. Please try again later.',
  },
  MALFORMED_REQUEST: {
    message: 'AI_MALFORMED_REQUEST',
    statusCode: 400,
    description: 'The AI request was malformed and rejected by the provider.',
  },
  NETWORK_ERROR: {
    message: 'AI_NETWORK_ERROR',
    statusCode: 503,
    description: 'A network error occurred while contacting the AI provider.',
  },
  CONFIGURATION_ERROR: {
    message: 'AI_CONFIGURATION_ERROR',
    statusCode: 500,
    description: 'The AI provider is misconfigured and cannot start.',
  },
} as const satisfies Record<string, IAppException>;
