import { IAppException } from '@core/exceptions/app.exception';

export const USERS_ERRORS = {
  USER_NOT_FOUND: {
    message: 'USER_NOT_FOUND',
    statusCode: 404,
    description: 'The requested user profile does not exist.',
  },
} as const satisfies Record<string, IAppException>;
