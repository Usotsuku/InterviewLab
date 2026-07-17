import { registerAs } from '@nestjs/config';

export interface Config {
  port: number;
  environment: 'development' | 'production';
  database: {
    uri: string;
  };
  auth: {
    jwtSecret: string;
    accessTokenExpiresIn: string;
    refreshTokenExpiresIn: string;
  };
  ai: {
    geminiApiKey: string;
    provider: string;
    gemini: {
      model: string;
      temperature: number;
      topP: number;
      topK: number;
      maxOutputTokens: number;
    };
    retry: {
      maxAttempts: number;
      baseDelayMs: number;
      maxDelayMs: number;
    };
    timeout: {
      cvAnalysisMs: number;
      questionGenerationMs: number;
      answerEvaluationMs: number;
      sessionSummaryMs: number;
    };
  };
  storage: {
    type: 'local' | 's3';
    localUploadPath: string;
  };
}

export default registerAs('config', (): Config => ({
  port: parseInt(process.env.PORT || '3000', 10),
  environment: (process.env.NODE_ENV as 'development' | 'production') || 'development',
  database: {
    uri: process.env.DATABASE_URI || 'mongodb://localhost:27017/interview_lab',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'fallback_secret_key',
    accessTokenExpiresIn: '15m',
    refreshTokenExpiresIn: '7d',
  },
  ai: {
    provider: process.env.AI_PROVIDER || 'gemini',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    gemini: {
      model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
      temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.4'),
      topP: parseFloat(process.env.GEMINI_TOP_P || '0.95'),
      topK: parseInt(process.env.GEMINI_TOP_K || '40', 10),
      maxOutputTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '8192', 10),
    },
    retry: {
      maxAttempts: parseInt(process.env.AI_RETRY_MAX || '3', 10),
      baseDelayMs: parseInt(process.env.AI_RETRY_DELAY_MS || '1000', 10),
      maxDelayMs: parseInt(process.env.AI_RETRY_MAX_DELAY_MS || '10000', 10),
    },
    timeout: {
      cvAnalysisMs: parseInt(process.env.AI_TIMEOUT_CV || '45000', 10),
      questionGenerationMs: parseInt(process.env.AI_TIMEOUT_QUESTIONS || '30000', 10),
      answerEvaluationMs: parseInt(process.env.AI_TIMEOUT_EVAL || '25000', 10),
      sessionSummaryMs: parseInt(process.env.AI_TIMEOUT_SUMMARY || '40000', 10),
    },
  },
  storage: {
    type: (process.env.STORAGE_TYPE as 'local' | 's3') || 'local',
    localUploadPath: process.env.LOCAL_UPLOAD_PATH || './uploads',
  },
}));
