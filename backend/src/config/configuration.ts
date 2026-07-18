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
    provider: string;
    geminiApiKey: string | undefined;
    gemini: {
      model: string;
      temperature: number;
      topP: number;
      topK: number;
      maxOutputTokens: number;
    };
    timeoutMs: number;
    maxRetries: number;
    retry: {
      baseDelayMs: number;
      maxDelayMs: number;
    };
  };
  storage: {
    type: 'local' | 's3';
    localUploadPath: string;
  };
  throttle: {
    ttl: number;
    limit: number;
    authTtl: number;
    authLimit: number;
  };
}

export default registerAs('config', (): Config => ({
  port: parseInt(process.env.PORT || '3000', 10),
  environment: (process.env.NODE_ENV as 'development' | 'production') || 'development',
  database: {
    uri: process.env.DATABASE_URI || 'mongodb://localhost:27017/interview_lab',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET ?? '',
    accessTokenExpiresIn: '15m',
    refreshTokenExpiresIn: '7d',
  },
  ai: {
    provider: process.env.AI_PROVIDER || 'gemini',
    geminiApiKey: process.env.GEMINI_API_KEY,
    gemini: {
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.4'),
      topP: parseFloat(process.env.GEMINI_TOP_P || '0.95'),
      topK: parseInt(process.env.GEMINI_TOP_K || '40', 10),
      maxOutputTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '8192', 10),
    },
    timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || '30000', 10),
    maxRetries: parseInt(process.env.AI_MAX_RETRIES || '3', 10),
    retry: {
      baseDelayMs: parseInt(process.env.AI_RETRY_DELAY_MS || '1000', 10),
      maxDelayMs: parseInt(process.env.AI_RETRY_MAX_DELAY_MS || '10000', 10),
    },
  },
  storage: {
    type: (process.env.STORAGE_TYPE as 'local' | 's3') || 'local',
    localUploadPath: process.env.LOCAL_UPLOAD_PATH || './uploads',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL_MS || '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
    authTtl: parseInt(process.env.AUTH_THROTTLE_TTL_MS || '60000', 10),
    authLimit: parseInt(process.env.AUTH_THROTTLE_LIMIT || '10', 10),
  },
}));
