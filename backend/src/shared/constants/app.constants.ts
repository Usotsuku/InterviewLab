export const APP_CONSTANTS = {
  API_PREFIX: 'api',
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  CV_MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10 MB
  AUDIO_MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024, // 50 MB
  ALLOWED_CV_MIME_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ALLOWED_AUDIO_MIME_TYPES: ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg'],
  CONTEXT_EVICTION_HOURS: 2,
  CONTEXT_MAX_ACTIVE_SESSIONS: 500,
  RATE_LIMIT_DEFAULT_WINDOW_MS: 60_000,
  RATE_LIMIT_DEFAULT_MAX: 100,
} as const;
