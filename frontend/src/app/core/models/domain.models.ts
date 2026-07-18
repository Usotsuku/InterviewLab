import { InterviewMode, InterviewStatus, QuestionType, QuestionDifficulty, CvAnalysisStatus } from './domain.enums';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface CandidateProfile {
  id: string;
  userId: string;
  summary: string;
  skills: string[];
  technologies: string[];
  strengths: string[];
  weaknesses: string[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  cvAnalysisStatus: CvAnalysisStatus;
  cvFileUrl: string | null;
  cvFileName: string | null;
  cvFileSize: number | null;
  cvUploadedAt: string | null;
  completionPercent: number;
  updatedAt: string;
}

export interface ExperienceEntry {
  company: string;
  position: string;
  startDate: string;
  endDate?: string | null;
  description?: string;
}

export interface ProjectEntry {
  name: string;
  description?: string;
  technologies: string[];
  url?: string;
}

export interface Interview {
  id: string;
  userId: string;
  mode: InterviewMode;
  status: InterviewStatus;
  title?: string;
  estimatedDuration?: number;
  overallScore?: number;
  communicationScore?: number;
  technicalScore?: number;
  confidenceScore?: number;
  totalQuestions: number;
  currentQuestionIndex: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface Question {
  id: string;
  interviewId: string;
  text: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  topic: string;
  order: number;
  expectedDurationSeconds: number;
}

export interface Answer {
  id: string;
  interviewId: string;
  questionId: string;
  transcript: string;
  audioUrl?: string;
  durationSeconds: number;
  submittedAt: string;
}

export interface InterviewMetrics {
  id: string;
  answerId: string;
  wordsPerMinute: number;
  avgPauseMs: number;
  longestPauseMs: number;
  silentTimePercent: number;
  fillerWordCount: number;
  repeatedWordCount: number;
  vocabularyRichness: number;
  avgSentenceLength: number;
  confidenceScore: number;
  communicationScore: number;
}

export interface AiEvaluation {
  id: string;
  answerId: string;
  technicalScore: number;
  semanticScore: number;
  communicationScore: number;
  missingConcepts: string[];
  communicationTips: string[];
  idealAnswer: string;
  promptVersion: string;
  modelUsed: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface UserSettings {
  userId: string;
  language: 'en' | 'fr' | 'ar' | 'es' | 'de';
  notificationsEnabled: boolean;
  interviewReminders: boolean;
}

export interface InterviewMetricsReport {
  wordsPerMinute: number;
  answerDuration: number;
  pauseCount: number;
  averagePause: number;
  longestPause: number;
  fillerCount: number;
  vocabularyRichness: number;
  repetitionScore: number;
  keywordCoverage: number;
  confidenceScore: number;
}

export interface AiEvaluationReport {
  technicalScore: number;
  communicationScore: number;
  correctnessScore: number;
  completenessScore: number;
  strengths: string[];
  weaknesses: string[];
  missingConcepts: string[];
  followUpQuestions: string[];
  feedback: string;
}

export interface QuestionReport {
  questionId: string;
  text: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  order: number;
  targetSkills?: string[];
  estimatedAnswerDuration?: number;
  transcript?: string;
  durationSeconds?: number;
  metrics?: InterviewMetricsReport;
  evaluation?: AiEvaluationReport;
}

export interface InterviewSummary {
  id: string;
  userId: string;
  mode: InterviewMode;
  status: InterviewStatus;
  title: string;
  estimatedDuration: number;
  totalQuestions: number;
  overallScore: number;
  communicationScore: number;
  technicalScore: number;
  confidenceScore: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface InterviewReport {
  interview: InterviewSummary;
  questions: QuestionReport[];
  totalAnswered: number;
  totalQuestions: number;
  durationMinutes: number;
}
