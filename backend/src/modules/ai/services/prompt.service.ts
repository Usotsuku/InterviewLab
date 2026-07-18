import { Injectable } from '@nestjs/common';

export interface PromptPayload {
  prompt: string;
  systemInstruction?: string;
}

const CV_ANALYSIS_SYSTEM_INSTRUCTION = `You are a professional CV analysis assistant. Your task is to extract structured information from CV content.

CRITICAL RULES:
- Return ONLY a valid JSON object. No markdown, no explanation, no text before or after.
- Do NOT wrap in code blocks.
- Do NOT include trailing commas.
- Dates must be in YYYY-MM-DD format. Use null if end date is not available.
- All string values must be non-empty strings.
- Arrays must contain at least one element where applicable.`;

const CV_ANALYSIS_JSON_SCHEMA = `{
  "summary": "Professional summary of the candidate",
  "skills": ["skill1", "skill2"],
  "technologies": ["technology1", "technology2"],
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "experience": [
    {
      "company": "Company name",
      "position": "Job title",
      "startDate": "2020-01-15",
      "endDate": "2023-06-30",
      "description": "Brief description of role"
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "description": "Brief description",
      "technologies": ["tech1", "tech2"],
      "url": "https://example.com"
    }
  ]
}`;

const INTERVIEW_GENERATION_SYSTEM_INSTRUCTION = `You are a professional interview question generator. Your task is to create a structured interview based on a candidate's profile.

CRITICAL RULES:
- Return ONLY a valid JSON object. No markdown, no explanation, no text before or after.
- Do NOT wrap in code blocks.
- Do NOT include trailing commas.
- All string values must be non-empty strings.
- Generate approximately 10 questions.
- Mix technical (TECHNICAL), behavioral (HR), and communication (COMMUNICATION) questions.
- Difficulty must be EASY, MEDIUM, or HARD based on the candidate's experience level.
- Do not generate company-specific questions.
- Questions should be relevant to the candidate's skills and experience.`;

const INTERVIEW_GENERATION_JSON_SCHEMA = `{
  "title": "Interview title describing the focus area",
  "estimatedDuration": 30,
  "questions": [
    {
      "order": 1,
      "type": "TECHNICAL",
      "difficulty": "MEDIUM",
      "text": "Question text here"
    }
  ]
}`;

const ANSWER_EVALUATION_SYSTEM_INSTRUCTION = `You are an expert technical interview evaluator. Your task is to assess a candidate's answer to an interview question based on the question details, the candidate's profile, their transcript, and objective speech/communication metrics.

CRITICAL RULES:
- Return ONLY a valid JSON object. No markdown, no explanation, no text before or after.
- Do NOT wrap in code blocks.
- Do NOT include trailing commas.
- All scores must be numbers between 0 and 100.
- Arrays must contain at least one element where applicable.`;

const ANSWER_EVALUATION_JSON_SCHEMA = `{
  "technicalScore": 85,
  "communicationScore": 90,
  "correctnessScore": 80,
  "completenessScore": 75,
  "strengths": ["Clear explanation of core concept"],
  "weaknesses": ["Missed edge cases"],
  "missingConcepts": ["Error handling patterns"],
  "followUpQuestions": ["Can you elaborate on how you would handle failures?"],
  "feedback": "Overall a solid answer that demonstrates..."
}`;

@Injectable()
export class PromptService {
  buildCvPrompt(cvText: string): PromptPayload {
    return {
      prompt: `Analyze the following CV content and extract structured information.

Return a JSON object with exactly this schema:
${CV_ANALYSIS_JSON_SCHEMA}

CV Content:
${cvText}`,
      systemInstruction: CV_ANALYSIS_SYSTEM_INSTRUCTION,
    };
  }

  buildInterviewPrompt(
    profileSummary: string,
    mode: string,
    count: number,
  ): PromptPayload {
    return {
      prompt: `Generate a ${mode} interview with approximately ${count} questions for a candidate with the following profile:

${profileSummary}

Return a JSON object with exactly this schema:
${INTERVIEW_GENERATION_JSON_SCHEMA}

Rules:
- Type must be one of: TECHNICAL, HR, COMMUNICATION
- Difficulty must be one of: EASY, MEDIUM, HARD
- estimatedDuration is in minutes
- Questions should be relevant to the candidate's skills and experience
- Do not generate company-specific questions`,
      systemInstruction: INTERVIEW_GENERATION_SYSTEM_INSTRUCTION,
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

  buildAnswerEvaluationPrompt(
    questionText: string,
    questionType: string,
    questionDifficulty: string,
    expectedKeywords: string[],
    transcript: string,
    candidateSummary: string,
    metrics: {
      wordsPerMinute?: number;
      confidenceScore?: number;
      vocabularyRichness?: number;
      keywordCoverage?: number;
      fillerCount?: number;
      repetitionScore?: number;
    },
  ): PromptPayload {
    const metricsBlock = [
      `Words per minute: ${metrics.wordsPerMinute ?? 'N/A'}`,
      `Confidence score: ${metrics.confidenceScore ?? 'N/A'}`,
      `Vocabulary richness: ${metrics.vocabularyRichness ?? 'N/A'}`,
      `Keyword coverage: ${metrics.keywordCoverage ?? 'N/A'}`,
      `Filler word count: ${metrics.fillerCount ?? 'N/A'}`,
      `Repetition score: ${metrics.repetitionScore ?? 'N/A'}`,
    ].join('\n');

    return {
      prompt: `Evaluate the following interview answer.

Question:
Type: ${questionType}
Difficulty: ${questionDifficulty}
Expected Keywords: ${expectedKeywords.length > 0 ? expectedKeywords.join(', ') : 'None specified'}
Text: ${questionText}

Candidate Profile:
${candidateSummary || 'No profile available'}

Objective Metrics:
${metricsBlock}

Candidate's Transcript:
${transcript || '(No transcript provided)'}

Return a JSON object with exactly this schema:
${ANSWER_EVALUATION_JSON_SCHEMA}

Rules:
- Scores must be numbers between 0 and 100.
- strengths and weaknesses must each contain 1-5 short descriptive strings.
- missingConcepts lists important concepts the candidate failed to mention.
- followUpQuestions lists 1-3 follow-up questions a good interviewer would ask next.
- feedback is a 2-4 sentence summary of overall performance.
- Return ONLY a valid JSON object. No markdown, no explanation, no text before or after.`,
      systemInstruction: ANSWER_EVALUATION_SYSTEM_INSTRUCTION,
    };
  }
}
