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
  cvFileUrl?: string;
  updatedAt: string;
}

export interface ExperienceEntry {
  title: string;
  company: string;
  years: number;
  description: string;
}

export interface ProjectEntry {
  name: string;
  description: string;
  technologies: string[];
}

export interface Interview {
  id: string;
  userId: string;
  mode: InterviewMode;
  status: InterviewStatus;
  overallScore?: number;
  communicationScore?: number;
  technicalScore?: number;
  confidenceScore?: number;
  totalQuestions: number;
  currentQuestionIndex: number;
  startedAt?: string;
  endedAt?: string;
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
