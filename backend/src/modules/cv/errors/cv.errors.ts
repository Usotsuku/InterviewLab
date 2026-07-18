import { IAppException } from '@core/exceptions/app.exception';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const CV_ERRORS = {
  INVALID_FILE_TYPE: {
    message: 'INVALID_FILE_TYPE',
    statusCode: 400,
    description: 'Only PDF files are accepted.',
  },
  FILE_TOO_LARGE: {
    message: 'FILE_TOO_LARGE',
    statusCode: 400,
    description: `File exceeds maximum size of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`,
  },
  EMPTY_FILE: {
    message: 'EMPTY_FILE',
    statusCode: 400,
    description: 'Uploaded file is empty.',
  },
  CV_NOT_FOUND: {
    message: 'CV_NOT_FOUND',
    statusCode: 404,
    description: 'No CV has been uploaded for this profile.',
  },
  CV_UPLOAD_FAILED: {
    message: 'CV_UPLOAD_FAILED',
    statusCode: 500,
    description: 'Failed to store the CV file.',
  },
  CV_DELETE_FAILED: {
    message: 'CV_DELETE_FAILED',
    statusCode: 500,
    description: 'Failed to delete the CV file.',
  },
} as const satisfies Record<string, IAppException>;

export const CV_CONSTRAINTS = {
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIMETYPE: 'application/pdf',
  ALLOWED_EXTENSION: '.pdf',
} as const;
