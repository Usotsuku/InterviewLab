export enum InterviewMode {
  HR = 'HR',
  TECHNICAL = 'TECHNICAL',
  MIXED = 'MIXED',
}

export enum InterviewStatus {
  CREATED = 'CREATED',
  GENERATING = 'GENERATING',
  READY = 'READY',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum QuestionType {
  HR = 'HR',
  TECHNICAL = 'TECHNICAL',
  COMMUNICATION = 'COMMUNICATION',
}

export enum QuestionDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum CvAnalysisStatus {
  NOT_UPLOADED = 'NOT_UPLOADED',
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum NotificationType {
  CV_ANALYZED = 'CV_ANALYZED',
  SESSION_COMPLETED = 'SESSION_COMPLETED',
  IMPROVEMENT_TIP = 'IMPROVEMENT_TIP',
  SYSTEM = 'SYSTEM',
}

export enum AIProvider {
  GEMINI = 'gemini',
  KIMI = 'kimi',
  OPENAI = 'openai',
  CLAUDE = 'claude',
  GROQ = 'groq',
}

export enum SpeechSessionStatus {
  ACTIVE = 'ACTIVE',
  FINALIZING = 'FINALIZING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}
