/* Domain Enums — mirror backend shared/enums/domain.enums.ts */

export enum InterviewMode {
  HR = 'HR',
  TECHNICAL = 'TECHNICAL',
  MIXED = 'MIXED',
}

export enum InterviewStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum QuestionType {
  HR = 'HR',
  TECHNICAL = 'TECHNICAL',
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
