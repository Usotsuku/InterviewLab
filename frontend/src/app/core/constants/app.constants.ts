/**
 * InterviewLab — Application Constants
 */

export const APP_NAME = 'InterviewLab';
export const APP_TAGLINE = 'Master your interview with AI-powered feedback';

export const ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
  },
  DASHBOARD: '/dashboard',
  PROFILE: {
    VIEW: '/profile',
    EDIT: '/profile/edit',
  },
  INTERVIEW: {
    SETUP: '/interview/setup',
    SESSION: '/interview/session',
    RESULTS: '/interview/results',
  },
  HISTORY: {
    LIST: '/history',
    DETAIL: '/history',
  },
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: 'auth/login',
    REGISTER: 'auth/register',
    REFRESH: 'auth/refresh',
    LOGOUT: 'auth/logout',
  },
  USERS: {
    ME: 'users/me',
    PROFILE: 'users/profile',
  },
  CV: {
    UPLOAD: 'cv/upload',
    ANALYSIS: 'cv/analysis',
  },
  CANDIDATE_PROFILE: 'candidate-profile',
  INTERVIEWS: 'interviews',
  QUESTIONS: 'questions',
  ANSWERS: 'answers',
  METRICS: 'interview-metrics',
  NOTIFICATIONS: 'notifications',
  SETTINGS: 'settings',
} as const;

export const ACCEPTED_CV_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const ACCEPTED_AUDIO_TYPES = [
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
] as const;

export const MAX_CV_SIZE_MB = 10;
export const MAX_AUDIO_SIZE_MB = 50;

export const MIN_TRANSCRIPT_WORDS = 5;
export const MAX_TRANSCRIPT_WORDS = 2000;
