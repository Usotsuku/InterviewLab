import { Injectable } from '@nestjs/common';

export interface PromptPayload {
  prompt: string;
  systemInstruction?: string;
}

@Injectable()
export class PromptService {
  buildCvPrompt(cvText: string): PromptPayload {
    return {
      prompt: `Analyze the following CV content and extract structured information.\n\nCV Content:\n${cvText}`,
      systemInstruction: 'You are a professional CV analysis assistant. Extract skills, technologies, strengths, weaknesses, and generate a summary.',
    };
  }

  buildInterviewPrompt(
    profileSummary: string,
    mode: string,
    count: number,
  ): PromptPayload {
    return {
      prompt: `Generate ${count} ${mode} interview questions for a candidate with this profile:\n\n${profileSummary}`,
      systemInstruction: 'You are an expert interview question generator. Create relevant, challenging questions.',
    };
  }

  buildEvaluationPrompt(
    question: string,
    transcript: string,
  ): PromptPayload {
    return {
      prompt: `Evaluate the following answer to the interview question.\n\nQuestion: ${question}\nAnswer: ${transcript}`,
      systemInstruction: 'You are an expert interview evaluator. Assess technical accuracy, communication clarity, and completeness.',
    };
  }
}
