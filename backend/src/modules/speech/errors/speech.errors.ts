import { IAppException } from '@core/exceptions/app.exception';

export const SpeechErrors: Record<string, IAppException> = {
  SESSION_NOT_FOUND: {
    message: 'Speech session not found',
    statusCode: 404,
    description: 'The requested speech session does not exist or has already expired',
  },
  SESSION_ALREADY_ACTIVE: {
    message: 'A speech session is already active for this question',
    statusCode: 409,
    description: 'Finish the current session before starting a new one',
  },
  INVALID_SESSION_STATE: {
    message: 'Invalid speech session state for this operation',
    statusCode: 409,
    description: 'The session is not in the correct state to perform this action',
  },
  TRANSCRIPTION_FAILED: {
    message: 'Audio transcription failed',
    statusCode: 500,
    description: 'The speech provider was unable to transcribe the audio',
  },
  PROVIDER_UNAVAILABLE: {
    message: 'Speech provider is unavailable',
    statusCode: 503,
    description: 'The speech recognition service is temporarily unavailable',
  },
  AUDIO_EMPTY: {
    message: 'No audio data received',
    statusCode: 400,
    description: 'The audio buffer is empty or too short to process',
  },
  SESSION_EXPIRED: {
    message: 'Speech session has expired',
    statusCode: 410,
    description: 'The speech session exceeded the maximum duration',
  },
  INTERVIEW_NOT_FOUND: {
    message: 'Interview not found',
    statusCode: 404,
    description: 'The specified interview does not exist',
  },
  QUESTION_NOT_FOUND: {
    message: 'Question not found',
    statusCode: 404,
    description: 'The specified question does not exist in this interview',
  },
  STORAGE_FAILED: {
    message: 'Audio storage failed',
    statusCode: 500,
    description: 'Failed to persist the audio file to storage',
  },
};
