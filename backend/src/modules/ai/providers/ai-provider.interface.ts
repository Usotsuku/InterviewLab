export const AI_PROVIDER = 'AI_PROVIDER';

export interface GenerateRequest {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
}

export interface GenerateResponse {
  text: string;
  tokenUsage: { input: number; output: number };
  provider: string;
  model: string;
  durationMs: number;
}

export abstract class AIProvider {
  abstract readonly name: string;

  abstract generate(request: GenerateRequest): Promise<GenerateResponse>;
  abstract healthCheck(): Promise<boolean>;
  abstract estimateTokens(text: string): number;
  abstract supportsStreaming(): boolean;
}
