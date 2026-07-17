# InterviewLab — Software Architecture Blueprint v2.0

> **Status**: Official Architecture Blueprint — Version 2  
> **Previous Version**: v1.0 (frozen — all decisions preserved)  
> **Audience**: Engineering team building InterviewLab  
> **Stack**: Angular 18+ · NestJS 10 · Fastify · MongoDB · Mongoose · Gemini API · Docker  
> **Prepared by**: Principal Software Architect  
> **Change Scope**: AI subsystem (Part 1), Speech subsystem (Part 2), Frontend update (Part 3), Backend update (Part 4), Responsibility matrix (Part 5), Communication diagrams (Part 6)

---

## What Changed from v1.0

v1.0 established the global modular architecture, database design, authentication flow, metrics engine philosophy, and both folder trees at a structural level.

v2.0 **does not change any of those decisions**. It drills into two subsystems that were introduced at an architectural level in v1.0 but not fully specified:

- **AI Architecture** — The `modules/ai/` backend module and `core/ai/` frontend service are now fully specified with interfaces, providers, prompt management, context management, retry/timeout strategies, and error handling.
- **Speech Architecture** — The `core/speech/` frontend services are now fully specified with service contracts, browser permission management, the recording and transcript lifecycles, audio state machine, language management, and error handling.

All additions slot into the folder trees from v1.0 without moving or renaming existing entries.

---

## Table of Contents

**AI Architecture**
1. [AI Subsystem Overview](#1-ai-subsystem-overview)
2. [AI Interfaces and Contracts](#2-ai-interfaces-and-contracts)
3. [Provider Architecture](#3-provider-architecture)
4. [GeminiProvider Implementation](#4-gemini-provider-implementation)
5. [Prompt Management System](#5-prompt-management-system)
6. [Context Management and Conversation Memory](#6-context-management-and-conversation-memory)
7. [Retry Strategy](#7-retry-strategy)
8. [Timeout Strategy](#8-timeout-strategy)
9. [AI Error Handling](#9-ai-error-handling)
10. [AI Logging](#10-ai-logging)
11. [Future Provider Support](#11-future-provider-support)

**Speech Architecture**
12. [Speech Subsystem Overview](#12-speech-subsystem-overview)
13. [Speech Service Architecture](#13-speech-service-architecture)
14. [MediaRecorder Integration](#14-mediarecorder-integration)
15. [Web Speech API Integration](#15-web-speech-api-integration)
16. [Recording Lifecycle](#16-recording-lifecycle)
17. [Transcript Lifecycle](#17-transcript-lifecycle)
18. [Audio State Machine](#18-audio-state-machine)
19. [Browser Permissions Management](#19-browser-permissions-management)
20. [Language Management](#20-language-management)
21. [Speech Error Handling](#21-speech-error-handling)

**Integration**
22. [Frontend Update — Angular Architecture](#22-frontend-update--angular-architecture)
23. [Backend Update — NestJS Architecture](#23-backend-update--nestjs-architecture)
24. [Module Responsibility Matrix](#24-module-responsibility-matrix)
25. [Communication Architecture](#25-communication-architecture)
26. [Updated Folder Trees](#26-updated-folder-trees)
27. [Updated Dependency Diagrams](#27-updated-dependency-diagrams)

---

# PART 1 — AI ARCHITECTURE

## 1. AI Subsystem Overview

### 1.1 Architectural Position

The AI subsystem is a **pure infrastructure module**. It has no knowledge of InterviewLab's business domain.

```
AI Subsystem Position in the Stack:

┌────────────────────────────────────────────┐
│           BUSINESS MODULES                 │
│   cv · interview · question · answer       │
│   (import AIService, know NOTHING else)    │
└────────────────────┬───────────────────────┘
                     │ imports
┌────────────────────▼───────────────────────┐
│              AI MODULE                     │
│   AIService (public facade)                │
│   PromptBuilder (prompt construction)      │
│   ContextManager (session context)         │
│   RetryExecutor (resilience)               │
└────────────────────┬───────────────────────┘
                     │ injects via token
┌────────────────────▼───────────────────────┐
│           IAIProvider (interface)          │
│              (Port — Hexagonal)            │
└────────────────────┬───────────────────────┘
                     │ implements
┌────────────────────▼───────────────────────┐
│           GeminiProvider                   │
│   (Adapter — Gemini SDK only lives here)   │
└────────────────────┬───────────────────────┘
                     │ calls
┌────────────────────▼───────────────────────┐
│           Gemini Developer API             │
└────────────────────────────────────────────┘
```

### 1.2 Core Design Principles

**Principle 1: The AI module is not a business module.**  
It provides AI capabilities as a service. It does not know what an "interview" is. It does not know what a "candidate profile" is. It receives structured inputs (strings, typed context objects) and returns structured outputs (typed result objects). Business meaning is added by the calling module.

**Principle 2: The provider is always behind an interface.**  
Every other module in the system calls `AIService`. `AIService` calls `IAIProvider`. `IAIProvider` is implemented by `GeminiProvider`. If Gemini is replaced by Claude tomorrow, only `GeminiProvider` changes. Zero business module changes required.

**Principle 3: Prompts are first-class artifacts.**  
Prompts are not inline strings scattered across service methods. They are versioned template functions, each living in a dedicated file. This makes them reviewable, testable, and evolvable independently of the calling code.

**Principle 4: Context is managed, not assumed.**  
Multi-turn AI interactions (e.g., follow-up questions during a session) require context. The `ContextManager` is the single place responsible for building, maintaining, and clearing conversation context. Business services never manually construct `history[]` arrays.

**Principle 5: Resilience is built in.**  
AI APIs are external services. They fail, rate-limit, and time out. The `RetryExecutor` wraps all provider calls. Business services never implement retry logic themselves.

---

## 2. AI Interfaces and Contracts

### 2.1 Provider Interface (`IAIProvider`)

This is the architectural Port. Every AI operation the system needs is declared here. Adding a capability to the AI system means adding a method to this interface and implementing it in all providers.

```typescript
// modules/ai/interfaces/ai-provider.interface.ts

export interface IAIProvider {
  /**
   * Analyze a CV text and extract structured candidate information.
   * Input: raw extracted text from PDF/DOCX.
   * Output: structured profile data.
   */
  analyzeCv(input: CvAnalysisInput): Promise<CvAnalysisResult>;

  /**
   * Generate interview questions tailored to a candidate profile and mode.
   * Input: profile context + interview mode + question count.
   * Output: ordered list of generated questions.
   */
  generateQuestions(input: QuestionGenerationInput): Promise<GeneratedQuestion[]>;

  /**
   * Evaluate a single answer against its question and candidate context.
   * Input: question text + transcript + profile summary.
   * Output: scores, missing concepts, communication tips.
   */
  evaluateAnswer(input: AnswerEvaluationInput): Promise<AnswerEvaluationResult>;

  /**
   * Generate an overall session summary after all answers are submitted.
   * Input: session context with all Q&A pairs.
   * Output: narrative summary + overall recommendations.
   */
  generateSessionSummary(input: SessionSummaryInput): Promise<SessionSummaryResult>;

  /**
   * Health check — verify provider connectivity.
   * Used at startup and monitoring.
   */
  ping(): Promise<boolean>;
}
```

**Why all operations are on a single interface:**  
All four operations share the same provider configuration (API key, model, timeout, retry settings). Splitting into `ICvAnalysisProvider`, `IQuestionProvider`, etc., would create artificial fragmentation while requiring each provider to implement multiple interfaces. A real alternative provider (Claude, GPT-4) can perform all four operations with different prompts but the same underlying API client.

### 2.2 Input Contracts

Input objects are **pure data structures** — no methods, no class logic. They exist to make the `IAIProvider` contract type-safe and to document exactly what each operation needs.

```typescript
// modules/ai/interfaces/ai-inputs.interface.ts

export interface CvAnalysisInput {
  cvText: string;           // Extracted plain text from CV document
  language: string;         // ISO 639-1 code — prompts adapt accordingly
  promptVersion: string;    // Which prompt template to use
}

export interface QuestionGenerationInput {
  profileSummary: string;   // AI-generated summary from CV analysis
  skills: string[];         // Candidate's declared skills
  technologies: string[];   // Candidate's tech stack
  mode: InterviewMode;      // HR | TECHNICAL | MIXED
  count: number;            // Number of questions to generate (default: 10)
  difficulty: QuestionDifficulty; // EASY | MEDIUM | HARD
  focusArea?: string;       // Optional: specific topic to focus on
  language: string;
  promptVersion: string;
}

export interface AnswerEvaluationInput {
  questionText: string;     // The interview question that was asked
  transcript: string;       // The user's spoken answer (transcribed)
  profileSummary: string;   // Candidate context for relevance scoring
  questionType: QuestionType; // HR | TECHNICAL
  durationSeconds: number;  // Used as a signal for answer depth
  language: string;
  promptVersion: string;
  conversationContext?: ConversationTurn[]; // Prior Q&A for continuity
}

export interface SessionSummaryInput {
  mode: InterviewMode;
  profileSummary: string;
  turns: SessionTurn[];     // All Q&A pairs with their evaluations
  metricsAggregate: MetricsAggregate; // Aggregated metrics for context
  language: string;
  promptVersion: string;
}

export interface ConversationTurn {
  role: 'user' | 'model';
  content: string;
}

export interface SessionTurn {
  questionText: string;
  questionType: QuestionType;
  transcript: string;
  technicalScore: number;
  semanticScore: number;
  missingConcepts: string[];
}

export interface MetricsAggregate {
  averageWpm: number;
  averageFillerCount: number;
  averageVocabularyRichness: number;
  totalDurationSeconds: number;
}
```

### 2.3 Result Contracts

```typescript
// modules/ai/interfaces/ai-results.interface.ts

export interface CvAnalysisResult {
  summary: string;
  skills: string[];
  technologies: string[];
  strengths: string[];
  weaknesses: string[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  rawResponse: string;      // Full model output for debugging
  promptVersion: string;    // Records which prompt produced this
  modelUsed: string;        // e.g., 'gemini-1.5-pro'
}

export interface GeneratedQuestion {
  text: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  topic: string;            // e.g., 'System Design', 'Leadership'
  expectedDurationSeconds: number; // Hint for the UI timer
}

export interface AnswerEvaluationResult {
  technicalScore: number;       // 0–100: technical correctness
  semanticScore: number;        // 0–100: relevance to the question
  communicationScore: number;   // 0–100: clarity and structure
  missingConcepts: string[];    // Key points the answer missed
  communicationTips: string[];  // AI improvement suggestions
  idealAnswer: string;          // AI's model answer for reference
  rawResponse: string;
  promptVersion: string;
  modelUsed: string;
}

export interface SessionSummaryResult {
  overallNarrative: string;     // 2–4 paragraph human-readable summary
  topStrengths: string[];       // 3 strongest performance areas
  topImprovements: string[];    // 3 priority improvement areas
  recommendedTopics: string[];  // Topics to study before next session
  rawResponse: string;
  promptVersion: string;
  modelUsed: string;
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
```

### 2.4 AIService Public API

`AIService` is the only class that other business modules import. It is the public API of the AI subsystem.

```typescript
// modules/ai/services/ai.service.ts

@Injectable()
export class AIService {
  constructor(
    @Inject(AI_PROVIDER_TOKEN) private readonly _provider: IAIProvider,
    private readonly _promptBuilder: PromptBuilderService,
    private readonly _contextManager: ContextManagerService,
    private readonly _retryExecutor: RetryExecutorService,
    private readonly _logger: Logger,
  ) {}

  async analyzeCv(
    cvText: string,
    language: string = 'en',
  ): Promise<CvAnalysisResult> { ... }

  async generateQuestions(
    profile: ProfileContext,
    options: GenerateQuestionsOptions,
  ): Promise<GeneratedQuestion[]> { ... }

  async evaluateAnswer(
    question: QuestionContext,
    transcript: string,
    sessionId: string,
  ): Promise<AnswerEvaluationResult> { ... }

  async generateSessionSummary(
    session: SessionContext,
  ): Promise<SessionSummaryResult> { ... }

  async ping(): Promise<boolean> { ... }
}
```

**Why `AIService` transforms domain objects into provider inputs:**  
The business modules (e.g., `InterviewService`) work with domain types: `Interview`, `CandidateProfile`, `Question`. The `IAIProvider` works with simple string inputs and typed result objects — it has no knowledge of domain models. `AIService` performs the transformation. This keeps the provider free from business model dependencies.

---

## 3. Provider Architecture

### 3.1 The Provider Token

```typescript
// modules/ai/tokens/ai-provider.token.ts
export const AI_PROVIDER_TOKEN = Symbol('AI_PROVIDER_TOKEN');
```

**Why a Symbol instead of a string:**  
A `Symbol` is guaranteed unique. String tokens like `'AI_PROVIDER'` can silently collide if two modules both define the same string. A `Symbol` collision is impossible.

### 3.2 Module Configuration

```typescript
// modules/ai/ai.module.ts

@Module({
  imports: [ConfigModule],
  providers: [
    AIService,
    PromptBuilderService,
    ContextManagerService,
    RetryExecutorService,
    PromptRegistryService,
    {
      provide: AI_PROVIDER_TOKEN,
      useFactory: (config: ConfigService) => {
        const providerName = config.get<string>('ai.provider', 'gemini');
        switch (providerName) {
          case 'gemini': return new GeminiProvider(config);
          // case 'openai': return new OpenAIProvider(config);
          // case 'claude': return new ClaudeProvider(config);
          // case 'groq':   return new GroqProvider(config);
          default:
            throw new Error(`Unknown AI provider: ${providerName}`);
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [AIService],
})
export class AIModule {}
```

**Why a factory provider instead of `useClass`:**  
`useClass: GeminiProvider` would hardcode Gemini at compile time. The factory reads `config.get('ai.provider')` at runtime, meaning switching providers is a configuration change — not a code change. In Docker, `AI_PROVIDER=claude` selects the Claude adapter without rebuilding the image.

**Why only `AIService` is exported:**  
No other module should know that `GeminiProvider`, `PromptBuilderService`, or `ContextManagerService` exist. The encapsulation boundary of the AI module is `AIService`. If other modules could import `PromptBuilderService` directly, they would couple themselves to the AI module's internals.

---

## 4. GeminiProvider Implementation

### 4.1 Provider Class

```typescript
// modules/ai/providers/gemini.provider.ts

@Injectable()
export class GeminiProvider implements IAIProvider {
  private readonly _client: GoogleGenerativeAI;
  private readonly _model: GenerativeModel;
  private readonly _modelName: string;
  private readonly _logger = new Logger(GeminiProvider.name);

  constructor(private readonly _config: ConfigService) {
    this._modelName = _config.get<string>('ai.gemini.model', 'gemini-1.5-pro');
    this._client = new GoogleGenerativeAI(_config.get<string>('ai.geminiApiKey'));
    this._model = this._client.getGenerativeModel({
      model: this._modelName,
      generationConfig: {
        temperature: _config.get<number>('ai.gemini.temperature', 0.4),
        topP: _config.get<number>('ai.gemini.topP', 0.95),
        topK: _config.get<number>('ai.gemini.topK', 40),
        maxOutputTokens: _config.get<number>('ai.gemini.maxOutputTokens', 8192),
        responseMimeType: 'application/json',  // Force JSON output
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      ],
    });
  }

  async analyzeCv(input: CvAnalysisInput): Promise<CvAnalysisResult> {
    const startMs = Date.now();
    this._logger.log(`[analyzeCv] Starting — lang=${input.language} promptV=${input.promptVersion}`);

    const result = await this._model.generateContent(input.renderedPrompt);
    const text = result.response.text();
    const parsed = this._parseJsonResponse<CvAnalysisResult>(text, 'analyzeCv');

    this._logger.log(`[analyzeCv] Completed in ${Date.now() - startMs}ms`);
    return { ...parsed, rawResponse: text, promptVersion: input.promptVersion, modelUsed: this._modelName };
  }

  async generateQuestions(input: QuestionGenerationInput): Promise<GeneratedQuestion[]> {
    const startMs = Date.now();
    const result = await this._model.generateContent(input.renderedPrompt);
    const text = result.response.text();
    const parsed = this._parseJsonResponse<{ questions: GeneratedQuestion[] }>(text, 'generateQuestions');
    this._logger.log(`[generateQuestions] ${parsed.questions.length} questions in ${Date.now() - startMs}ms`);
    return parsed.questions;
  }

  async evaluateAnswer(input: AnswerEvaluationInput): Promise<AnswerEvaluationResult> {
    // Multi-turn: use startChat() with history if context exists
    if (input.conversationContext?.length) {
      return this._evaluateWithHistory(input);
    }
    return this._evaluateSingleTurn(input);
  }

  async generateSessionSummary(input: SessionSummaryInput): Promise<SessionSummaryResult> {
    const result = await this._model.generateContent(input.renderedPrompt);
    const text = result.response.text();
    const parsed = this._parseJsonResponse<SessionSummaryResult>(text, 'generateSessionSummary');
    return { ...parsed, rawResponse: text, promptVersion: input.promptVersion, modelUsed: this._modelName };
  }

  async ping(): Promise<boolean> {
    try {
      await this._model.generateContent('Reply with {"status":"ok"}');
      return true;
    } catch {
      return false;
    }
  }

  private async _evaluateWithHistory(input: AnswerEvaluationInput): Promise<AnswerEvaluationResult> {
    const chat = this._model.startChat({
      history: input.conversationContext!.map(turn => ({
        role: turn.role,
        parts: [{ text: turn.content }],
      })),
    });
    const result = await chat.sendMessage(input.renderedPrompt);
    const text = result.response.text();
    const parsed = this._parseJsonResponse<AnswerEvaluationResult>(text, 'evaluateAnswer');
    return { ...parsed, rawResponse: text, promptVersion: input.promptVersion, modelUsed: this._modelName };
  }

  private async _evaluateSingleTurn(input: AnswerEvaluationInput): Promise<AnswerEvaluationResult> {
    const result = await this._model.generateContent(input.renderedPrompt);
    const text = result.response.text();
    const parsed = this._parseJsonResponse<AnswerEvaluationResult>(text, 'evaluateAnswer');
    return { ...parsed, rawResponse: text, promptVersion: input.promptVersion, modelUsed: this._modelName };
  }

  private _parseJsonResponse<T>(text: string, operation: string): T {
    try {
      // Strip potential markdown code fences: ```json ... ```
      const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      return JSON.parse(cleaned) as T;
    } catch (err) {
      this._logger.error(`[${operation}] JSON parse failed. Raw response: ${text.substring(0, 500)}`);
      throw new AIParseError(operation, text);
    }
  }
}
```

### 4.2 Configuration Keys

```typescript
// config/configuration.ts — AI section
ai: {
  provider: process.env.AI_PROVIDER || 'gemini',       // 'gemini' | 'openai' | 'claude' | 'groq'
  geminiApiKey: process.env.GEMINI_API_KEY,
  gemini: {
    model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.4'),
    topP: parseFloat(process.env.GEMINI_TOP_P || '0.95'),
    topK: parseInt(process.env.GEMINI_TOP_K || '40'),
    maxOutputTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '8192'),
  },
  retry: {
    maxAttempts: parseInt(process.env.AI_RETRY_MAX || '3'),
    baseDelayMs: parseInt(process.env.AI_RETRY_DELAY_MS || '1000'),
    maxDelayMs: parseInt(process.env.AI_RETRY_MAX_DELAY_MS || '10000'),
  },
  timeout: {
    cvAnalysisMs: parseInt(process.env.AI_TIMEOUT_CV || '45000'),
    questionGenerationMs: parseInt(process.env.AI_TIMEOUT_QUESTIONS || '30000'),
    answerEvaluationMs: parseInt(process.env.AI_TIMEOUT_EVAL || '25000'),
    sessionSummaryMs: parseInt(process.env.AI_TIMEOUT_SUMMARY || '40000'),
  },
},
```

**Why per-operation timeouts:**  
CV analysis processes potentially long documents and returns complex structured data — it needs more time. Answer evaluation is simpler — it needs less. A single global timeout would either be too short for CV analysis or too lenient for answer evaluation, masking performance regressions.

---

## 5. Prompt Management System

### 5.1 Design: Prompts as Versioned Template Functions

Prompts are **not inline strings** inside service methods. They are organized as:
1. A versioned prompt file per operation
2. A `PromptRegistryService` that manages all registered versions
3. A `PromptBuilderService` that selects the correct version and renders it with variables

**Why versioned prompts:**
- AI model behavior changes across Gemini versions. A prompt that works perfectly on `gemini-1.5-pro` may behave differently on `gemini-2.0`. Versioning lets you maintain multiple prompt variants and A/B test them.
- When a prompt is changed, the `promptVersion` stored in the database (`ai_evaluations.promptVersion`) tells you exactly which prompt generated a result. This is critical for debugging inconsistent outputs.
- Prompt engineering is iterative. Versioning enables improvement without regression: deploy v2 of a prompt alongside v1, compare outputs, then deprecate v1.

### 5.2 Prompt Registry

```typescript
// modules/ai/prompts/prompt-registry.service.ts

export interface PromptTemplate {
  version: string;           // e.g., 'cv-analysis-v1', 'cv-analysis-v2'
  operation: AIOperation;    // CV_ANALYSIS | QUESTION_GENERATION | ANSWER_EVALUATION | SESSION_SUMMARY
  description: string;       // Human-readable description of what changed
  active: boolean;           // Whether this version is currently in use
  render: (variables: Record<string, unknown>) => string; // Template function
}

export type AIOperation =
  | 'CV_ANALYSIS'
  | 'QUESTION_GENERATION'
  | 'ANSWER_EVALUATION'
  | 'SESSION_SUMMARY';

@Injectable()
export class PromptRegistryService {
  private readonly _registry = new Map<string, PromptTemplate>();

  constructor() {
    this._registerAll();
  }

  getActive(operation: AIOperation): PromptTemplate {
    const active = [...this._registry.values()].find(
      (p) => p.operation === operation && p.active,
    );
    if (!active) throw new Error(`No active prompt found for operation: ${operation}`);
    return active;
  }

  getByVersion(version: string): PromptTemplate {
    const template = this._registry.get(version);
    if (!template) throw new Error(`Prompt version not found: ${version}`);
    return template;
  }

  list(operation?: AIOperation): PromptTemplate[] {
    return [...this._registry.values()].filter(
      (p) => !operation || p.operation === operation,
    );
  }

  private _registerAll(): void {
    // CV Analysis prompts
    this._registry.set('cv-analysis-v1', cvAnalysisV1Prompt);

    // Question Generation prompts
    this._registry.set('question-generation-v1', questionGenerationV1Prompt);

    // Answer Evaluation prompts
    this._registry.set('answer-evaluation-v1', answerEvaluationV1Prompt);

    // Session Summary prompts
    this._registry.set('session-summary-v1', sessionSummaryV1Prompt);
  }
}
```

### 5.3 Prompt Template Files

Each operation has one file per version. Prompts are template functions, not string constants.

```typescript
// modules/ai/prompts/cv-analysis/cv-analysis-v1.prompt.ts

import { PromptTemplate } from '../prompt-registry.service';

export const cvAnalysisV1Prompt: PromptTemplate = {
  version: 'cv-analysis-v1',
  operation: 'CV_ANALYSIS',
  description: 'Initial CV analysis prompt. Extracts structured profile data in JSON format.',
  active: true,
  render: ({ cvText, language }: { cvText: string; language: string }) => `
You are an expert technical recruiter and career coach with 20 years of experience.
Your task is to analyze a candidate's CV and extract structured information.

LANGUAGE: Respond in ${language === 'fr' ? 'French' : 'English'}.

CV CONTENT:
---
${cvText}
---

INSTRUCTIONS:
- Extract all relevant technical skills mentioned explicitly or implied by project descriptions.
- Identify strengths based on demonstrated achievements, not just listed skills.
- Identify weaknesses or gaps based on what is missing or underdeveloped.
- Keep the summary professional, factual, and under 150 words.
- For experience entries, estimate years if not explicitly stated.
- Return ONLY valid JSON, no markdown, no explanation, no code fences.

REQUIRED JSON STRUCTURE:
{
  "summary": "string — professional summary under 150 words",
  "skills": ["string"],
  "technologies": ["string"],
  "strengths": ["string — max 5 items"],
  "weaknesses": ["string — max 5 items"],
  "experience": [
    { "title": "string", "company": "string", "years": number, "description": "string" }
  ],
  "projects": [
    { "name": "string", "description": "string", "technologies": ["string"] }
  ]
}
`.trim(),
};
```

```typescript
// modules/ai/prompts/answer-evaluation/answer-evaluation-v1.prompt.ts

export const answerEvaluationV1Prompt: PromptTemplate = {
  version: 'answer-evaluation-v1',
  operation: 'ANSWER_EVALUATION',
  description: 'Evaluates a spoken answer against the question and profile context.',
  active: true,
  render: ({
    questionText,
    questionType,
    transcript,
    profileSummary,
    durationSeconds,
    language,
  }: {
    questionText: string;
    questionType: string;
    transcript: string;
    profileSummary: string;
    durationSeconds: number;
    language: string;
  }) => `
You are an expert interview coach evaluating a candidate's spoken answer.
Respond in ${language === 'fr' ? 'French' : 'English'}.

CANDIDATE BACKGROUND:
${profileSummary}

INTERVIEW QUESTION (${questionType}):
"${questionText}"

CANDIDATE'S ANSWER (spoken, ${durationSeconds}s duration):
"${transcript}"

EVALUATION CRITERIA:
- Technical Score (0–100): Correctness and depth of technical content. For HR questions, assess relevance and specificity.
- Semantic Score (0–100): How well the answer addresses what was actually asked.
- Communication Score (0–100): Clarity, structure, and professionalism of expression.
- Missing Concepts: Key points, technologies, or frameworks that were not mentioned but were expected.
- Communication Tips: Specific, actionable suggestions to improve the answer delivery.
- Ideal Answer: A concise model answer that would score 90+ on all dimensions.

IMPORTANT:
- Base scores on the transcript content, not the duration.
- Missing concepts should be concrete (e.g., "Did not mention Big O notation") not vague.
- Communication tips should be specific (e.g., "Use the STAR method to structure behavioral answers").
- Return ONLY valid JSON.

REQUIRED JSON STRUCTURE:
{
  "technicalScore": number,
  "semanticScore": number,
  "communicationScore": number,
  "missingConcepts": ["string"],
  "communicationTips": ["string"],
  "idealAnswer": "string"
}
`.trim(),
};
```

### 5.4 PromptBuilderService

```typescript
// modules/ai/services/prompt-builder.service.ts

@Injectable()
export class PromptBuilderService {
  constructor(private readonly _registry: PromptRegistryService) {}

  buildCvAnalysisPrompt(input: {
    cvText: string;
    language: string;
  }): { renderedPrompt: string; promptVersion: string } {
    const template = this._registry.getActive('CV_ANALYSIS');
    return {
      renderedPrompt: template.render(input),
      promptVersion: template.version,
    };
  }

  buildQuestionGenerationPrompt(input: {
    profileSummary: string;
    skills: string[];
    technologies: string[];
    mode: string;
    count: number;
    difficulty: string;
    focusArea?: string;
    language: string;
  }): { renderedPrompt: string; promptVersion: string } {
    const template = this._registry.getActive('QUESTION_GENERATION');
    return {
      renderedPrompt: template.render(input),
      promptVersion: template.version,
    };
  }

  buildAnswerEvaluationPrompt(input: {
    questionText: string;
    questionType: string;
    transcript: string;
    profileSummary: string;
    durationSeconds: number;
    language: string;
  }): { renderedPrompt: string; promptVersion: string } {
    const template = this._registry.getActive('ANSWER_EVALUATION');
    return {
      renderedPrompt: template.render(input),
      promptVersion: template.version,
    };
  }

  buildSessionSummaryPrompt(input: {
    mode: string;
    profileSummary: string;
    turns: SessionTurn[];
    metricsAggregate: MetricsAggregate;
    language: string;
  }): { renderedPrompt: string; promptVersion: string } {
    const template = this._registry.getActive('SESSION_SUMMARY');
    return {
      renderedPrompt: template.render(input),
      promptVersion: template.version,
    };
  }
}
```

**Why `PromptBuilderService` exists separately from `AIService`:**  
`AIService` is responsible for orchestrating the AI flow: get input, build prompt, call provider, handle errors, return result. `PromptBuilderService` is responsible for prompt selection and rendering. If `AIService` built prompts itself, it would have two reasons to change: AI orchestration logic and prompt template management. Separating them respects SRP.

---

## 6. Context Management and Conversation Memory

### 6.1 Design: Session-Scoped Context

InterviewLab needs conversational context in one scenario: **answer evaluation within a session**. When evaluating question 5, the AI can be more insightful if it knows what the candidate answered for questions 1–4. This is conversation memory.

Context is **session-scoped**, not user-scoped. When a session ends, its context is discarded. Context is never persisted to the database (it can always be reconstructed from stored answers if needed).

```typescript
// modules/ai/services/context-manager.service.ts

export interface SessionContext {
  sessionId: string;
  turns: ConversationTurn[];
  createdAt: Date;
  lastAccessedAt: Date;
}

@Injectable()
export class ContextManagerService implements OnModuleDestroy {
  // In-memory store: sessionId → context
  // NOT persisted to MongoDB. Reconstructible from answers if lost.
  private readonly _contexts = new Map<string, SessionContext>();

  // Cleanup interval: remove contexts not accessed in 2 hours
  private readonly _cleanupIntervalMs = 2 * 60 * 60 * 1000;
  private _cleanupTimer: NodeJS.Timeout;

  constructor() {
    this._cleanupTimer = setInterval(
      () => this._evictStaleSessions(),
      this._cleanupIntervalMs,
    );
  }

  onModuleDestroy(): void {
    clearInterval(this._cleanupTimer);
  }

  /**
   * Retrieve the conversation history for a session.
   * Returns empty array if no context exists (first question).
   */
  getContext(sessionId: string): ConversationTurn[] {
    const ctx = this._contexts.get(sessionId);
    if (!ctx) return [];
    ctx.lastAccessedAt = new Date();
    return [...ctx.turns]; // Return a copy — callers must not mutate
  }

  /**
   * Append a Q&A exchange to session context.
   * Called after each answer is evaluated.
   */
  appendTurn(sessionId: string, questionText: string, answerTranscript: string): void {
    let ctx = this._contexts.get(sessionId);
    if (!ctx) {
      ctx = { sessionId, turns: [], createdAt: new Date(), lastAccessedAt: new Date() };
      this._contexts.set(sessionId, ctx);
    }
    ctx.turns.push(
      { role: 'user', content: `Question: ${questionText}` },
      { role: 'model', content: `Answer received: ${answerTranscript.substring(0, 200)}...` },
    );
    ctx.lastAccessedAt = new Date();
  }

  /**
   * Clear context when a session is completed or cancelled.
   */
  clearContext(sessionId: string): void {
    this._contexts.delete(sessionId);
  }

  /**
   * Returns how many active session contexts are in memory.
   * Used for monitoring/health checks.
   */
  getActiveContextCount(): number {
    return this._contexts.size;
  }

  private _evictStaleSessions(): void {
    const cutoff = Date.now() - this._cleanupIntervalMs;
    for (const [sessionId, ctx] of this._contexts.entries()) {
      if (ctx.lastAccessedAt.getTime() < cutoff) {
        this._contexts.delete(sessionId);
      }
    }
  }
}
```

**Why in-memory context and not MongoDB:**
- Context turns are transient. They exist to improve AI quality during a live session, not to be stored as business data.
- MongoDB reads/writes for every turn would add latency to an already latency-sensitive operation (AI evaluation + metrics computation are already happening on answer submission).
- Conversation history is recoverable: the `answers` collection stores all transcripts. If the server restarts, the context is lost but can be reconstructed. The UX impact is minimal — evaluations continue to work, just without multi-turn context.

**Why a cleanup interval:**  
If a user abandons a session without completing it, the context entry would remain in memory indefinitely. The 2-hour eviction removes stale entries to prevent memory growth.

---

## 7. Retry Strategy

### 7.1 Design: Exponential Backoff with Jitter

AI API calls fail for predictable reasons: rate limits, transient network errors, temporary model unavailability. These failures are recoverable with retries. The retry policy uses **exponential backoff with jitter** to avoid the thundering herd problem.

```typescript
// modules/ai/services/retry-executor.service.ts

export interface RetryPolicy {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableErrors: RetryableErrorCode[];
}

export type RetryableErrorCode =
  | 'RATE_LIMIT_EXCEEDED'
  | 'SERVICE_UNAVAILABLE'
  | 'GATEWAY_TIMEOUT'
  | 'NETWORK_ERROR';

@Injectable()
export class RetryExecutorService {
  private readonly _policy: RetryPolicy;
  private readonly _logger = new Logger(RetryExecutorService.name);

  constructor(private readonly _config: ConfigService) {
    this._policy = {
      maxAttempts: _config.get<number>('ai.retry.maxAttempts', 3),
      baseDelayMs: _config.get<number>('ai.retry.baseDelayMs', 1000),
      maxDelayMs: _config.get<number>('ai.retry.maxDelayMs', 10000),
      retryableErrors: [
        'RATE_LIMIT_EXCEEDED',
        'SERVICE_UNAVAILABLE',
        'GATEWAY_TIMEOUT',
        'NETWORK_ERROR',
      ],
    };
  }

  async execute<T>(
    operation: () => Promise<T>,
    operationName: string,
    policy: Partial<RetryPolicy> = {},
  ): Promise<T> {
    const effective = { ...this._policy, ...policy };
    let lastError: Error;

    for (let attempt = 1; attempt <= effective.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (err) {
        lastError = err as Error;
        const code = this._classifyError(err);

        if (!effective.retryableErrors.includes(code)) {
          this._logger.warn(`[${operationName}] Non-retryable error on attempt ${attempt}: ${code}`);
          throw err; // Propagate immediately
        }

        if (attempt === effective.maxAttempts) break;

        const delay = this._calculateDelay(attempt, effective);
        this._logger.warn(
          `[${operationName}] Attempt ${attempt} failed (${code}). Retrying in ${delay}ms...`,
        );
        await this._sleep(delay);
      }
    }

    this._logger.error(`[${operationName}] All ${effective.maxAttempts} attempts exhausted.`);
    throw lastError!;
  }

  private _calculateDelay(attempt: number, policy: RetryPolicy): number {
    // Exponential backoff: delay = min(baseDelay * 2^(attempt-1), maxDelay)
    const exponential = policy.baseDelayMs * Math.pow(2, attempt - 1);
    const capped = Math.min(exponential, policy.maxDelayMs);
    // Add jitter: ±25% of the capped delay
    const jitter = capped * 0.25 * (Math.random() * 2 - 1);
    return Math.round(capped + jitter);
  }

  private _classifyError(err: unknown): RetryableErrorCode | 'NON_RETRYABLE' {
    if (!(err instanceof Error)) return 'NON_RETRYABLE';

    const message = err.message.toLowerCase();
    if (message.includes('rate limit') || message.includes('429')) return 'RATE_LIMIT_EXCEEDED';
    if (message.includes('503') || message.includes('unavailable')) return 'SERVICE_UNAVAILABLE';
    if (message.includes('504') || message.includes('timeout')) return 'GATEWAY_TIMEOUT';
    if (message.includes('network') || message.includes('econnrefused')) return 'NETWORK_ERROR';
    return 'NON_RETRYABLE';
  }

  private _sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

**How `RetryExecutorService` is used in `AIService`:**

```typescript
async analyzeCv(cvText: string, language: string): Promise<CvAnalysisResult> {
  const { renderedPrompt, promptVersion } = this._promptBuilder.buildCvAnalysisPrompt({
    cvText, language,
  });

  return this._retryExecutor.execute(
    () => this._provider.analyzeCv({ cvText, language, promptVersion, renderedPrompt }),
    'analyzeCv',
  );
}
```

**Why jitter:**  
Without jitter, all retry attempts from concurrent requests that failed at the same time would retry at exactly the same delay interval — creating a synchronized wave of requests that overwhelms the API again. Jitter spreads the retries across a time window.

**Why not retry `NON_RETRYABLE` errors:**  
A JSON parse error (malformed AI output) or an authentication error (wrong API key) will not improve with retrying. Retrying non-retryable errors wastes time and API credits.

---

## 8. Timeout Strategy

### 8.1 Per-Operation Timeout Wrapping

Every AI call is wrapped in a `Promise.race()` against a timeout promise. If the operation does not resolve within the configured timeout, the timeout wins and throws `AITimeoutError`.

```typescript
// modules/ai/services/ai.service.ts — timeout wrapper

private async _withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  operationName: string,
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new AITimeoutError(operationName, timeoutMs));
    }, timeoutMs);
  });

  return Promise.race([operation(), timeoutPromise]);
}
```

**Usage in `AIService`:**

```typescript
async evaluateAnswer(question: QuestionContext, transcript: string, sessionId: string) {
  const { renderedPrompt, promptVersion } = this._promptBuilder.buildAnswerEvaluationPrompt({...});
  const context = this._contextManager.getContext(sessionId);

  const result = await this._withTimeout(
    () => this._retryExecutor.execute(
      () => this._provider.evaluateAnswer({ ...input, conversationContext: context }),
      'evaluateAnswer',
    ),
    this._config.get('ai.timeout.answerEvaluationMs'),
    'evaluateAnswer',
  );

  this._contextManager.appendTurn(sessionId, question.text, transcript);
  return result;
}
```

**Timeout + Retry interaction:**  
The timeout wraps the entire retry executor call. If 3 retries each take 8 seconds, the timeout kills the operation after (e.g.) 25 seconds regardless. This prevents indefinite blocking.

---

## 9. AI Error Handling

### 9.1 Error Taxonomy

```typescript
// modules/ai/exceptions/ai.errors.ts

export const AI_ERRORS = {
  PROVIDER_UNAVAILABLE: {
    message: 'AI_PROVIDER_UNAVAILABLE',
    statusCode: 503,
    description: 'The AI service is temporarily unavailable. Please try again.',
  },
  TIMEOUT: {
    message: 'AI_OPERATION_TIMEOUT',
    statusCode: 504,
    description: 'The AI operation took too long to respond.',
  },
  PARSE_FAILED: {
    message: 'AI_RESPONSE_PARSE_FAILED',
    statusCode: 502,
    description: 'The AI returned an unexpected response format.',
  },
  RATE_LIMIT: {
    message: 'AI_RATE_LIMIT_EXCEEDED',
    statusCode: 429,
    description: 'AI API rate limit reached. Please wait before retrying.',
  },
  CV_ANALYSIS_FAILED: {
    message: 'CV_ANALYSIS_FAILED',
    statusCode: 422,
    description: 'Could not analyze the provided CV.',
  },
  QUESTION_GENERATION_FAILED: {
    message: 'QUESTION_GENERATION_FAILED',
    statusCode: 500,
    description: 'Could not generate interview questions.',
  },
  EVALUATION_FAILED: {
    message: 'ANSWER_EVALUATION_FAILED',
    statusCode: 500,
    description: 'Could not evaluate the provided answer.',
  },
} as const;
```

### 9.2 Custom Error Classes

```typescript
// modules/ai/exceptions/ai-provider.error.ts

export class AITimeoutError extends Error {
  constructor(operation: string, timeoutMs: number) {
    super(`AI operation '${operation}' timed out after ${timeoutMs}ms`);
    this.name = 'AITimeoutError';
  }
}

export class AIParseError extends Error {
  constructor(operation: string, rawResponse: string) {
    super(`Failed to parse AI response for operation '${operation}'`);
    this.name = 'AIParseError';
    this.rawResponse = rawResponse.substring(0, 1000); // Truncate for logs
  }
  readonly rawResponse: string;
}

export class AIProviderError extends Error {
  constructor(operation: string, originalError: Error) {
    super(`AI provider failed for operation '${operation}': ${originalError.message}`);
    this.name = 'AIProviderError';
    this.cause = originalError;
  }
}
```

### 9.3 Error Mapping in `AIService`

```typescript
async analyzeCv(cvText: string, language: string): Promise<CvAnalysisResult> {
  try {
    return await this._withTimeout(
      () => this._retryExecutor.execute(...),
      this._config.get('ai.timeout.cvAnalysisMs'),
      'analyzeCv',
    );
  } catch (err) {
    if (err instanceof AITimeoutError) {
      AppException.throw(AI_ERRORS.TIMEOUT);
    }
    if (err instanceof AIParseError) {
      this._logger.error(`CV analysis parse failed. Raw: ${err.rawResponse}`);
      AppException.throw(AI_ERRORS.PARSE_FAILED);
    }
    if (this._isRateLimitError(err)) {
      AppException.throw(AI_ERRORS.RATE_LIMIT);
    }
    this._logger.error('CV analysis failed with unknown error', err);
    AppException.throw(AI_ERRORS.CV_ANALYSIS_FAILED);
  }
}
```

**Why `AIService` maps errors to `AppException`:**  
The calling services (`CvService`, `AnswerService`) must not handle AI-specific errors. They call `AIService` and trust that if it throws, it throws an `AppException` that the `GlobalExceptionFilter` knows how to handle. The AI error taxonomy is private to the AI module.

---

## 10. AI Logging

### 10.1 Structured Log Fields

Every AI operation logs the following structured fields:

```typescript
// What is logged on EVERY AI call:
{
  operation: 'analyzeCv' | 'generateQuestions' | 'evaluateAnswer' | 'generateSessionSummary',
  provider: 'gemini' | 'openai' | 'claude' | 'groq',
  model: string,             // e.g., 'gemini-1.5-pro'
  promptVersion: string,     // e.g., 'cv-analysis-v1'
  durationMs: number,        // Wall clock time for the provider call
  tokenCount?: number,       // If the provider SDK exposes it
  attempt: number,           // Which retry attempt (1 = first try)
  success: boolean,
  errorCode?: string,        // If failed: the AI_ERRORS key
  sessionId?: string,        // For answer evaluation: which session
}
```

**Why `promptVersion` is logged:**  
When debugging a bad output, you need to know exactly which prompt produced it. Logging `promptVersion` on every call means you can grep logs for `promptVersion=cv-analysis-v1` and trace all outputs from that version.

**Why `durationMs` is logged:**  
AI response times vary significantly. Tracking duration per operation over time detects model performance regressions and helps set correct timeout values.

### 10.2 What Is Never Logged

```
NEVER LOG:
- The full CV text (PII — may contain address, phone number)
- The full transcript (PII — voice content)
- The Gemini API key
- The raw AI response (too large, potentially PII)
  Exception: On AIParseError only, log the first 1000 chars for debugging

ALWAYS SANITIZE before logging:
- Truncate any field exceeding 200 characters
- Redact any field named 'password', 'apiKey', 'token', 'secret'
```

---

## 11. Future Provider Support

### 11.1 Adding a New Provider

Adding Claude, OpenAI, or Groq requires exactly **three steps**:

1. **Create the provider class** implementing `IAIProvider`:

```typescript
// modules/ai/providers/openai.provider.ts
@Injectable()
export class OpenAIProvider implements IAIProvider {
  private readonly _client: OpenAI;

  constructor(config: ConfigService) {
    this._client = new OpenAI({ apiKey: config.get('ai.openaiApiKey') });
  }

  async analyzeCv(input: CvAnalysisInput): Promise<CvAnalysisResult> {
    const completion = await this._client.chat.completions.create({
      model: config.get('ai.openai.model', 'gpt-4o'),
      messages: [{ role: 'user', content: input.renderedPrompt }],
      response_format: { type: 'json_object' },
    });
    const text = completion.choices[0].message.content!;
    return this._parseJsonResponse<CvAnalysisResult>(text);
  }
  // ... remaining methods
}
```

2. **Register in the factory** in `ai.module.ts`:

```typescript
case 'openai': return new OpenAIProvider(config);
```

3. **Add configuration keys** for the new provider:

```typescript
// config/configuration.ts
openai: {
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL || 'gpt-4o',
}
```

**Zero changes required in:**
- `AIService`
- `PromptBuilderService`
- `ContextManagerService`
- `RetryExecutorService`
- Any business module (cv, interview, answer)

**Why prompts must be provider-agnostic:**  
The current prompts are written in plain English and rely on JSON output instructions. Both Gemini and GPT-4o understand these instructions identically. If a provider requires a fundamentally different prompt structure (e.g., Groq's fast models respond better to shorter prompts), a provider-specific prompt variant can be added to the registry with a different version key. The `PromptBuilderService` can be extended to select provider-specific variants.

### 11.2 Provider Capability Matrix

| Capability | Gemini 1.5 Pro | GPT-4o | Claude 3.5 Sonnet | Groq Llama 3 |
|---|---|---|---|---|
| CV Analysis | ✅ | ✅ | ✅ | ⚠️ (smaller context) |
| Question Generation | ✅ | ✅ | ✅ | ✅ |
| Answer Evaluation | ✅ | ✅ | ✅ | ✅ |
| Session Summary | ✅ | ✅ | ✅ | ⚠️ |
| Multi-turn Chat | ✅ | ✅ | ✅ | ✅ |
| JSON Response Mode | ✅ | ✅ | ⚠️ (prompt-only) | ⚠️ |
| Latency | Medium | Medium | Medium | **Fast** |
| Cost | Low | High | Medium | **Lowest** |

---

# PART 2 — SPEECH ARCHITECTURE

## 12. Speech Subsystem Overview

### 12.1 Architectural Position

The Speech subsystem is a **pure frontend infrastructure concern**. It lives entirely in the Angular application's `core/speech/` folder. The backend has no knowledge of the speech subsystem — it receives only the final outputs (transcript string, audio Blob).

```
Speech Subsystem Boundaries:

┌─────────────────────────────────────────────────┐
│         INTERVIEW FEATURE (Angular)             │
│   InterviewSessionPage (Smart Component)        │
│   └── uses SpeechFacadeService                  │
└─────────────────┬───────────────────────────────┘
                  │ single injection point
┌─────────────────▼───────────────────────────────┐
│         SPEECH FACADE (core/speech/)            │
│   SpeechFacadeService                           │
│   ├── AudioRecorderService                      │
│   ├── SpeechRecognitionService                  │
│   ├── TranscriptValidationService               │
│   ├── SpeechPermissionsService                  │
│   └── SpeechLanguageService                     │
└─────────────────────────────────────────────────┘

Speech NEVER calls:
- AIService or any AI-related code
- Any backend endpoint directly (the feature page does that)
- Any store outside core/speech/

Speech ONLY produces:
- finalTranscript: string
- audioBlob: Blob
- isRecording: Signal<boolean>
- speechState: Signal<SpeechState>
- permissionState: Signal<PermissionState>
```

**Why Speech is completely independent from AI:**  
Speech recognition converts audio to text. This is a deterministic browser API (`SpeechRecognition`). It has nothing to do with semantic understanding, scoring, or language model generation. Coupling them would make speech impossible to test without AI, and impossible to use in contexts where AI is not needed (e.g., a simple dictation tool built on the same codebase).

---

## 13. Speech Service Architecture

### 13.1 Service Inventory

| Service | Responsibility | Singleton |
|---|---|---|
| `SpeechFacadeService` | Single entry point for all speech operations. Coordinates all sub-services. | Yes |
| `AudioRecorderService` | MediaRecorder API: start, stop, stream, produce Blob | Yes |
| `SpeechRecognitionService` | Web Speech API: start, stop, interim transcript, final transcript | Yes |
| `TranscriptValidationService` | Validate transcript: empty, too short, too long | Yes |
| `SpeechPermissionsService` | Manage browser microphone permissions: request, check, observe changes | Yes |
| `SpeechLanguageService` | Select and manage recognition language. Sync with user settings. | Yes |

**Why a facade service:**  
The `InterviewSessionPage` should not need to inject five speech services and coordinate them. The facade pattern (known in Angular as a presentation service) provides a single, clean API: `speechFacade.startAnswering()`, `speechFacade.stopAnswering()`, `speechFacade.isRecording`. The page cares about the capability, not the implementation.

This also makes testing dramatically simpler: mock one service (`SpeechFacadeService`) instead of five.

### 13.2 Service Interfaces

```typescript
// core/speech/interfaces/speech-facade.interface.ts

export interface ISpeechFacade {
  // State signals (read-only from outside)
  readonly speechState: Signal<SpeechState>;
  readonly isRecording: Signal<boolean>;
  readonly interimTranscript: Signal<string>;
  readonly finalTranscript: Signal<string>;
  readonly permissionState: Signal<PermissionState>;
  readonly recordingDuration: Signal<number>; // seconds elapsed
  readonly hasError: Signal<boolean>;
  readonly error: Signal<SpeechError | null>;

  // Commands
  requestMicrophonePermission(): Promise<PermissionState>;
  startAnswering(): Promise<void>;
  stopAnswering(): SpeechResult;
  resetForNextQuestion(): void;
  destroy(): void;
}

export interface SpeechResult {
  transcript: string;
  audioBlob: Blob;
  durationSeconds: number;
  wordCount: number;
}

export type SpeechState =
  | 'IDLE'
  | 'REQUESTING_PERMISSION'
  | 'READY'
  | 'RECORDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'ERROR';

export type PermissionState =
  | 'UNKNOWN'
  | 'GRANTED'
  | 'DENIED'
  | 'PROMPT';
```

---

## 14. MediaRecorder Integration

### 14.1 AudioRecorderService

```typescript
// core/speech/services/audio-recorder.service.ts

@Injectable({ providedIn: 'root' })
export class AudioRecorderService {
  private _mediaRecorder: MediaRecorder | null = null;
  private _stream: MediaStream | null = null;
  private _chunks: Blob[] = [];
  private _startTime: number = 0;

  readonly isRecording = signal(false);
  readonly durationMs = signal(0);

  private _durationTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * Start recording. Requires an active MediaStream (from SpeechPermissionsService).
   * Returns the MediaStream for waveform visualization.
   */
  async start(stream: MediaStream): Promise<MediaStream> {
    if (this.isRecording()) {
      throw new SpeechError('ALREADY_RECORDING', 'Recording is already in progress');
    }

    this._chunks = [];
    this._stream = stream;
    this._startTime = Date.now();

    const mimeType = this._selectMimeType();
    this._mediaRecorder = new MediaRecorder(stream, { mimeType });

    this._mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) this._chunks.push(event.data);
    };

    this._mediaRecorder.onerror = (event) => {
      this.isRecording.set(false);
      throw new SpeechError('RECORDER_ERROR', event.error?.message ?? 'Unknown recorder error');
    };

    // Collect chunks every 250ms for progressive upload capability (future)
    this._mediaRecorder.start(250);
    this.isRecording.set(true);

    // Start duration timer
    this._durationTimer = setInterval(() => {
      this.durationMs.set(Date.now() - this._startTime);
    }, 100);

    return stream; // Return for waveform visualization
  }

  /**
   * Stop recording and return the captured audio as a Blob.
   */
  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this._mediaRecorder || !this.isRecording()) {
        reject(new SpeechError('NOT_RECORDING', 'No recording in progress'));
        return;
      }

      this._mediaRecorder.onstop = () => {
        const blob = new Blob(this._chunks, { type: this._mediaRecorder!.mimeType });
        this._cleanup();
        resolve(blob);
      };

      this._mediaRecorder.stop();
      this.isRecording.set(false);

      if (this._durationTimer) {
        clearInterval(this._durationTimer);
        this._durationTimer = null;
      }
    });
  }

  /**
   * Get a real-time AnalyserNode for waveform visualization.
   * Returns null if no stream is active.
   */
  getAnalyserNode(): AnalyserNode | null {
    if (!this._stream) return null;
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(this._stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    return analyser;
  }

  private _selectMimeType(): string {
    const preferred = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/mp4'];
    return preferred.find((type) => MediaRecorder.isTypeSupported(type)) ?? '';
  }

  private _cleanup(): void {
    this._stream?.getTracks().forEach((track) => track.stop());
    this._stream = null;
    this._mediaRecorder = null;
    this._chunks = [];
    this.durationMs.set(0);
  }
}
```

**Why `start()` accepts a `MediaStream` instead of calling `getUserMedia` itself:**  
`SpeechPermissionsService` owns microphone access. It requests the permission once, caches the stream, and provides it on demand. `AudioRecorderService` uses what is given to it. Separating these concerns means:
1. The stream can be reused across multiple recording sessions without re-prompting for permission.
2. `SpeechPermissionsService` is the single source of truth for permission state.
3. `AudioRecorderService` is pure recording logic — it does not know about browser permissions.

**Why `getAnalyserNode()`:**  
The `WaveformComponent` needs a real-time audio frequency analysis to render the waveform animation. `AnalyserNode` from the Web Audio API provides this data. The recorder is the only entity with access to the stream, so it creates the analyser.

---

## 15. Web Speech API Integration

### 15.1 SpeechRecognitionService

```typescript
// core/speech/services/speech-recognition.service.ts

@Injectable({ providedIn: 'root' })
export class SpeechRecognitionService {
  private _recognition: SpeechRecognition | null = null;
  private _accumulatedFinal = '';

  readonly isListening = signal(false);
  readonly interimTranscript = signal('');
  readonly finalTranscript = signal('');
  readonly recognitionError = signal<SpeechRecognitionError | null>(null);

  readonly isSupported: boolean = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

  /**
   * Start continuous speech recognition.
   */
  start(language: string): void {
    if (!this.isSupported) {
      throw new SpeechError('NOT_SUPPORTED', 'Web Speech API is not supported in this browser');
    }
    if (this.isListening()) return; // Idempotent

    this._accumulatedFinal = '';
    this.finalTranscript.set('');
    this.interimTranscript.set('');
    this.recognitionError.set(null);

    const SpeechRecognitionImpl =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    this._recognition = new SpeechRecognitionImpl();
    this._recognition!.continuous = true;
    this._recognition!.interimResults = true;
    this._recognition!.maxAlternatives = 1;
    this._recognition!.lang = language;

    this._recognition!.onresult = (event: SpeechRecognitionEvent) => {
      this._handleResult(event);
    };

    this._recognition!.onerror = (event: SpeechRecognitionErrorEvent) => {
      this._handleError(event);
    };

    this._recognition!.onend = () => {
      // Auto-restart if still in listening mode (handles Chrome's auto-stop behavior)
      if (this.isListening()) {
        this._recognition?.start();
      }
    };

    this._recognition!.start();
    this.isListening.set(true);
  }

  /**
   * Stop recognition and return the final accumulated transcript.
   */
  stop(): string {
    if (!this.isListening()) return this.finalTranscript();

    this._recognition?.stop();
    this._recognition = null;
    this.isListening.set(false);
    this.interimTranscript.set('');

    return this.finalTranscript();
  }

  /**
   * Reset state for the next question without destroying the service.
   */
  reset(): void {
    this.stop();
    this._accumulatedFinal = '';
    this.finalTranscript.set('');
    this.interimTranscript.set('');
    this.recognitionError.set(null);
  }

  private _handleResult(event: SpeechRecognitionEvent): void {
    let interim = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;

      if (result.isFinal) {
        this._accumulatedFinal += transcript + ' ';
      } else {
        interim += transcript;
      }
    }

    this.finalTranscript.set(this._accumulatedFinal.trim());
    this.interimTranscript.set(interim);
  }

  private _handleError(event: SpeechRecognitionErrorEvent): void {
    const errorCode = event.error;
    this.recognitionError.set({ code: errorCode, message: this._mapErrorCode(errorCode) });

    // 'no-speech' is not terminal — don't stop listening
    if (errorCode !== 'no-speech') {
      this.isListening.set(false);
      this._recognition = null;
    }
  }

  private _mapErrorCode(code: string): string {
    const map: Record<string, string> = {
      'no-speech': 'SPEECH_NO_SPEECH_DETECTED',
      'audio-capture': 'SPEECH_AUDIO_CAPTURE_FAILED',
      'not-allowed': 'SPEECH_MICROPHONE_DENIED',
      'network': 'SPEECH_NETWORK_ERROR',
      'aborted': 'SPEECH_ABORTED',
      'language-not-supported': 'SPEECH_LANGUAGE_NOT_SUPPORTED',
      'service-not-allowed': 'SPEECH_SERVICE_NOT_ALLOWED',
    };
    return map[code] ?? 'SPEECH_UNKNOWN_ERROR';
  }
}
```

**Why `continuous: true` with an `onend` auto-restart:**  
Chrome's `SpeechRecognition` with `continuous: true` stops after ~60 seconds of silence. The `onend` handler restarts it if `isListening()` is still true. This ensures long answers are not truncated.

**Why accumulate into `_accumulatedFinal`:**  
The `SpeechRecognition` API resets its internal accumulation on restart. By maintaining `_accumulatedFinal` in the service, the transcript is preserved across automatic restarts.

**Why `isSupported` is a public property:**  
Some browsers (e.g., Firefox) do not support `SpeechRecognition`. The `SpeechFacadeService` checks this at initialization and shows a browser compatibility warning instead of throwing an unhandled error.

---

## 16. Recording Lifecycle

### 16.1 State Transitions

```
                   ┌─────────┐
                   │  IDLE   │ ← Initial state / after reset
                   └────┬────┘
                        │ user clicks "Start Answering"
                        │ SpeechFacade.startAnswering()
                        ▼
              ┌──────────────────────┐
              │ REQUESTING_PERMISSION│ ← SpeechPermissionsService.request()
              └──────────┬───────────┘
                         │
               ┌─────────┴───────────┐
          GRANTED                  DENIED
               │                     │
               ▼                     ▼
          ┌─────────┐         ┌─────────────┐
          │  READY  │         │    ERROR    │ ← Show browser instructions
          └────┬────┘         └─────────────┘
               │ permission confirmed, stream open
               │ AudioRecorderService.start()
               │ SpeechRecognitionService.start()
               ▼
          ┌───────────┐
          │ RECORDING │ ← isRecording = true, timer running
          └─────┬─────┘    interim transcript updating live
                │
                │ user clicks "Stop Answering"
                │ SpeechFacade.stopAnswering()
                ▼
          ┌────────────┐
          │ PROCESSING │ ← MediaRecorder.stop() + blob assembly
          └─────┬──────┘
                │ Blob ready
                │ TranscriptValidationService.validate()
                ▼
        ┌───────┴────────┐
   VALID transcript    INVALID transcript
        │                    │
        ▼                    ▼
   ┌──────────┐         ┌─────────────┐
   │COMPLETED │         │    ERROR    │ ← Show validation error + allow retry
   └──────────┘         └─────────────┘
        │
        │ feature page calls resetForNextQuestion()
        ▼
   ┌─────────┐
   │  IDLE   │ ← Ready for next question
   └─────────┘
```

---

## 17. Transcript Lifecycle

### 17.1 Transcript State

```
SpeechRecognitionService maintains:

interimTranscript: Signal<string>
  ├── Updated every 100–300ms while speaking
  ├── Shows ONLY unconfirmed recognition in progress
  └── Displayed in TranscriptDisplayComponent with italic/grey styling

finalTranscript: Signal<string>
  ├── Accumulates confirmed words
  ├── Updated when recognition result.isFinal === true
  ├── Persists across recognition restarts
  └── Displayed in TranscriptDisplayComponent with normal styling

Complete answer transcript = finalTranscript() at time of stop()
```

### 17.2 TranscriptValidationService

```typescript
// core/speech/services/transcript-validation.service.ts

export interface TranscriptValidationResult {
  isValid: boolean;
  wordCount: number;
  characterCount: number;
  estimatedDurationAccuracy: boolean; // Sanity check: WPM within plausible range
  errors: TranscriptValidationError[];
}

export type TranscriptValidationError =
  | 'TRANSCRIPT_EMPTY'
  | 'TRANSCRIPT_TOO_SHORT'        // < 10 words
  | 'TRANSCRIPT_TOO_LONG'         // > 2000 words
  | 'TRANSCRIPT_IMPLAUSIBLE_WPM'; // < 20 WPM or > 250 WPM

@Injectable({ providedIn: 'root' })
export class TranscriptValidationService {
  private readonly MIN_WORDS = 10;
  private readonly MAX_WORDS = 2000;
  private readonly MIN_WPM = 20;
  private readonly MAX_WPM = 250;

  validate(transcript: string, durationSeconds: number): TranscriptValidationResult {
    const trimmed = transcript.trim();
    const words = trimmed ? trimmed.split(/\s+/) : [];
    const wordCount = words.length;
    const characterCount = trimmed.length;
    const errors: TranscriptValidationError[] = [];

    if (!trimmed) errors.push('TRANSCRIPT_EMPTY');
    else if (wordCount < this.MIN_WORDS) errors.push('TRANSCRIPT_TOO_SHORT');
    if (wordCount > this.MAX_WORDS) errors.push('TRANSCRIPT_TOO_LONG');

    let estimatedDurationAccuracy = true;
    if (durationSeconds > 0 && wordCount > 0) {
      const wpm = (wordCount / durationSeconds) * 60;
      if (wpm < this.MIN_WPM || wpm > this.MAX_WPM) {
        estimatedDurationAccuracy = false;
        // Note: WPM implausibility is a warning, not a blocking error
        // It indicates potential recognition quality issues
      }
    }

    return {
      isValid: errors.length === 0,
      wordCount,
      characterCount,
      estimatedDurationAccuracy,
      errors,
    };
  }
}
```

**Why WPM plausibility is a warning, not a blocking error:**  
A transcript with implausible WPM (e.g., 5 WPM) indicates poor speech recognition quality, not necessarily a bad answer. Blocking the user from submitting in this case would be frustrating. Instead, the UI can show a "recognition quality warning" while still allowing submission.

---

## 18. Audio State Machine

### 18.1 SpeechFacadeService (The Coordinator)

```typescript
// core/speech/services/speech-facade.service.ts

@Injectable({ providedIn: 'root' })
export class SpeechFacadeService implements ISpeechFacade {
  // Exposed signals (computed from sub-service signals)
  readonly speechState = signal<SpeechState>('IDLE');
  readonly isRecording = computed(() => this.speechState() === 'RECORDING');
  readonly interimTranscript = this._recognition.interimTranscript.asReadonly();
  readonly finalTranscript = this._recognition.finalTranscript.asReadonly();
  readonly permissionState = this._permissions.permissionState.asReadonly();
  readonly recordingDuration = computed(() =>
    Math.floor(this._recorder.durationMs() / 1000),
  );
  readonly hasError = computed(() => this.speechState() === 'ERROR');
  readonly error = signal<SpeechError | null>(null);

  private _currentStream: MediaStream | null = null;

  constructor(
    private readonly _recorder: AudioRecorderService,
    private readonly _recognition: SpeechRecognitionService,
    private readonly _validator: TranscriptValidationService,
    private readonly _permissions: SpeechPermissionsService,
    private readonly _language: SpeechLanguageService,
  ) {}

  async requestMicrophonePermission(): Promise<PermissionState> {
    this.speechState.set('REQUESTING_PERMISSION');
    const state = await this._permissions.requestPermission();
    this.speechState.set(state === 'GRANTED' ? 'READY' : 'ERROR');
    if (state !== 'GRANTED') {
      this.error.set(new SpeechError('PERMISSION_DENIED', 'Microphone access was denied'));
    }
    return state;
  }

  async startAnswering(): Promise<void> {
    if (this.speechState() === 'RECORDING') return; // Idempotent

    // Ensure permission
    const permission = this._permissions.permissionState();
    if (permission !== 'GRANTED') {
      await this.requestMicrophonePermission();
      if (this._permissions.permissionState() !== 'GRANTED') return;
    }

    try {
      this._currentStream = await this._permissions.getStream();
      await this._recorder.start(this._currentStream);
      this._recognition.start(this._language.getActiveLanguage());
      this.speechState.set('RECORDING');
      this.error.set(null);
    } catch (err) {
      this.speechState.set('ERROR');
      this.error.set(err instanceof SpeechError ? err : new SpeechError('START_FAILED', String(err)));
    }
  }

  stopAnswering(): SpeechResult {
    if (this.speechState() !== 'RECORDING') {
      throw new SpeechError('NOT_RECORDING', 'Cannot stop — not currently recording');
    }

    this.speechState.set('PROCESSING');

    const transcript = this._recognition.stop();
    const durationSeconds = this.recordingDuration();

    // Note: audioBlob is returned asynchronously from MediaRecorder.
    // We set state to PROCESSING and resolve via promise chain.
    // The facade hides this complexity from the page.
    const validation = this._validator.validate(transcript, durationSeconds);

    if (!validation.isValid) {
      this.speechState.set('ERROR');
      this.error.set(new SpeechError(
        validation.errors[0],
        `Transcript validation failed: ${validation.errors.join(', ')}`,
      ));
    } else {
      this.speechState.set('COMPLETED');
    }

    return {
      transcript,
      audioBlob: new Blob(), // Populated after recorder.stop() resolves
      durationSeconds,
      wordCount: validation.wordCount,
    };
  }

  resetForNextQuestion(): void {
    this._recognition.reset();
    this.speechState.set('READY'); // Go back to READY (not IDLE — permission still granted)
    this.error.set(null);
  }

  destroy(): void {
    this._recognition.stop();
    this._currentStream?.getTracks().forEach(t => t.stop());
    this._currentStream = null;
    this.speechState.set('IDLE');
  }
}
```

---

## 19. Browser Permissions Management

### 19.1 SpeechPermissionsService

```typescript
// core/speech/services/speech-permissions.service.ts

@Injectable({ providedIn: 'root' })
export class SpeechPermissionsService {
  readonly permissionState = signal<PermissionState>('UNKNOWN');

  private _cachedStream: MediaStream | null = null;
  private _permissionStatus: PermissionStatus | null = null;

  constructor() {
    this._checkExistingPermission();
  }

  /**
   * Request microphone access from the browser.
   * On first call: shows browser permission dialog.
   * On subsequent calls: returns cached stream if already granted.
   */
  async requestPermission(): Promise<PermissionState> {
    this.permissionState.set('PROMPT');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this._cachedStream = stream;
      this.permissionState.set('GRANTED');

      // Observe future permission changes (user may revoke via browser UI)
      this._observePermissionChanges();

      return 'GRANTED';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        this.permissionState.set('DENIED');
        return 'DENIED';
      }
      this.permissionState.set('UNKNOWN');
      throw new SpeechError('PERMISSION_REQUEST_FAILED', err instanceof Error ? err.message : String(err));
    }
  }

  /**
   * Get the active MediaStream (requesting permission if needed).
   * Safe to call multiple times — stream is cached.
   */
  async getStream(): Promise<MediaStream> {
    if (this._cachedStream && this._areTracksActive()) {
      return this._cachedStream;
    }
    // Stream has been closed, request again
    await this.requestPermission();
    if (!this._cachedStream) {
      throw new SpeechError('STREAM_UNAVAILABLE', 'Could not obtain audio stream');
    }
    return this._cachedStream;
  }

  /**
   * Check if permission is already granted (e.g., on page reload).
   * Uses the Permissions API to query without triggering a dialog.
   */
  private async _checkExistingPermission(): Promise<void> {
    try {
      if (!navigator.permissions) return;
      this._permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      const state = this._mapPermissionState(this._permissionStatus.state);
      this.permissionState.set(state);
      this._observePermissionChanges();
    } catch {
      // Permissions API not supported — state remains UNKNOWN
    }
  }

  private _observePermissionChanges(): void {
    if (!this._permissionStatus) return;
    this._permissionStatus.onchange = () => {
      const newState = this._mapPermissionState(this._permissionStatus!.state);
      this.permissionState.set(newState);

      if (newState === 'DENIED') {
        // Invalidate cached stream
        this._cachedStream?.getTracks().forEach(t => t.stop());
        this._cachedStream = null;
      }
    };
  }

  private _mapPermissionState(state: PermissionState | string): PermissionState {
    switch (state) {
      case 'granted': return 'GRANTED';
      case 'denied': return 'DENIED';
      case 'prompt': return 'PROMPT';
      default: return 'UNKNOWN';
    }
  }

  private _areTracksActive(): boolean {
    return this._cachedStream?.getTracks().every(t => t.readyState === 'live') ?? false;
  }
}
```

**Why cache the stream:**  
Calling `getUserMedia()` on every recording start triggers the browser's permission dialog multiple times — a very poor UX. The cached stream is reused for the entire session.

**Why observe permission changes:**  
Users can revoke microphone access mid-session via browser settings. The `onchange` handler detects this and updates `permissionState`, allowing the UI to react (show a "Please re-enable microphone" prompt) instead of silently failing.

**Why check existing permission at construction:**  
If the user previously granted permission and reloads the page, `permissionState` would start as `UNKNOWN` even though access is already granted. Checking at construction time correctly sets `GRANTED` before any component renders, preventing unnecessary permission prompts.

---

## 20. Language Management

### 20.1 SpeechLanguageService

```typescript
// core/speech/services/speech-language.service.ts

export interface SpeechLanguage {
  code: string;          // BCP-47 language tag: 'en-US', 'fr-FR', 'ar-SA'
  label: string;         // 'English (US)'
  supported: boolean;    // Whether Web Speech API supports this language
}

export const SUPPORTED_SPEECH_LANGUAGES: SpeechLanguage[] = [
  { code: 'en-US', label: 'English (US)', supported: true },
  { code: 'en-GB', label: 'English (UK)', supported: true },
  { code: 'fr-FR', label: 'Français', supported: true },
  { code: 'ar-SA', label: 'العربية', supported: true },
  { code: 'es-ES', label: 'Español', supported: true },
  { code: 'de-DE', label: 'Deutsch', supported: true },
];

@Injectable({ providedIn: 'root' })
export class SpeechLanguageService {
  private readonly _activeLanguageCode = signal<string>('en-US');

  readonly activeLanguage = this._activeLanguageCode.asReadonly();
  readonly supportedLanguages = SUPPORTED_SPEECH_LANGUAGES;

  constructor(private readonly _userSettings: UserSettingsService) {
    this._syncFromUserSettings();
  }

  getActiveLanguage(): string {
    return this._activeLanguageCode();
  }

  setLanguage(code: string): void {
    const lang = SUPPORTED_SPEECH_LANGUAGES.find(l => l.code === code);
    if (!lang) throw new Error(`Unsupported speech language: ${code}`);
    if (!lang.supported) throw new SpeechError('LANGUAGE_NOT_SUPPORTED', `${lang.label} is not supported by the speech engine`);
    this._activeLanguageCode.set(code);
  }

  private _syncFromUserSettings(): void {
    // Map user's app language preference ('en' / 'fr') to a speech language code
    const appLanguage = this._userSettings.language();
    const mapped = this._mapAppLanguageToSpeech(appLanguage);
    this._activeLanguageCode.set(mapped);
  }

  private _mapAppLanguageToSpeech(appLang: string): string {
    const defaults: Record<string, string> = {
      en: 'en-US',
      fr: 'fr-FR',
      ar: 'ar-SA',
      es: 'es-ES',
      de: 'de-DE',
    };
    return defaults[appLang] ?? 'en-US';
  }
}
```

**Why language is a service, not a constant:**  
Language affects how speech recognition parses phonemes. English recognition set to French would produce garbage. The language must sync with the user's interview language preference. A service (with signal reactivity) allows the active language to update automatically when user settings change.

---

## 21. Speech Error Handling

### 21.1 SpeechError Class

```typescript
// core/speech/errors/speech.error.ts

export type SpeechErrorCode =
  | 'NOT_SUPPORTED'
  | 'PERMISSION_DENIED'
  | 'PERMISSION_REQUEST_FAILED'
  | 'STREAM_UNAVAILABLE'
  | 'ALREADY_RECORDING'
  | 'NOT_RECORDING'
  | 'RECORDER_ERROR'
  | 'RECOGNITION_ERROR'
  | 'LANGUAGE_NOT_SUPPORTED'
  | 'TRANSCRIPT_EMPTY'
  | 'TRANSCRIPT_TOO_SHORT'
  | 'TRANSCRIPT_TOO_LONG'
  | 'START_FAILED'
  | 'NETWORK_ERROR';

export class SpeechError extends Error {
  constructor(
    public readonly code: SpeechErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'SpeechError';
  }
}
```

### 21.2 Error Handling in the Interview Page

```typescript
// features/interview/pages/interview-session/interview-session.page.ts

// The page does NOT handle SpeechError directly.
// It reads the error signal from SpeechFacadeService
// and maps it to a translation key for display.

readonly speechErrorMessage = computed(() => {
  const error = this._speechFacade.error();
  if (!error) return null;
  return this._translateService.instant(`SPEECH_ERRORS.${error.code}`);
});
```

Translation keys in `assets/i18n/en.json`:
```json
{
  "SPEECH_ERRORS": {
    "NOT_SUPPORTED": "Your browser does not support voice input. Please use Chrome or Edge.",
    "PERMISSION_DENIED": "Microphone access was denied. Please enable it in your browser settings.",
    "TRANSCRIPT_EMPTY": "No speech was detected. Please try speaking clearly.",
    "TRANSCRIPT_TOO_SHORT": "Your answer was too short. Please provide a more detailed response.",
    "RECORDER_ERROR": "An audio recording error occurred. Please try again.",
    "NETWORK_ERROR": "Speech recognition requires an internet connection."
  }
}
```

### 21.3 Speech Error Sequence Diagram

```
User clicks "Start Answering"
         │
         ▼
SpeechFacade.startAnswering()
         │
         ├── SpeechPermissionsService.getStream()
         │        │
         │        └── getUserMedia() → DENIED
         │                  │
         │                  ▼
         │         permissionState.set('DENIED')
         │         error.set(SpeechError('PERMISSION_DENIED'))
         │         speechState.set('ERROR')
         │
         ▼
InterviewSessionPage reacts to speechState() === 'ERROR'
         │
         ▼
Displays: "Microphone access was denied. Please enable it in your browser settings."
         + Link to browser permission settings instructions
```

---

# PART 3 — FRONTEND UPDATE

## 22. Frontend Update — Angular Architecture

### 22.1 New Files in `core/speech/`

These files did not exist in v1.0. They are now fully specified.

```
core/speech/
├── interfaces/
│   ├── speech-facade.interface.ts     ← ISpeechFacade, SpeechResult, SpeechState, PermissionState
│   └── speech-language.interface.ts  ← SpeechLanguage
│
├── services/
│   ├── speech-facade.service.ts      ← SpeechFacadeService (coordinator)
│   ├── audio-recorder.service.ts     ← AudioRecorderService (MediaRecorder)
│   ├── speech-recognition.service.ts ← SpeechRecognitionService (Web Speech API)
│   ├── transcript-validation.service.ts ← TranscriptValidationService
│   ├── speech-permissions.service.ts ← SpeechPermissionsService (getUserMedia)
│   └── speech-language.service.ts    ← SpeechLanguageService (BCP-47 management)
│
├── errors/
│   └── speech.error.ts               ← SpeechError class + SpeechErrorCode type
│
└── constants/
    └── speech-languages.constant.ts  ← SUPPORTED_SPEECH_LANGUAGES
```

### 22.2 New Files in `core/ai/` (Frontend AI Interface)

The frontend does not call the Gemini API directly. It communicates with the backend `AIService` via HTTP. However, the frontend needs typed interfaces for the AI operation results (for type-safe handling of responses).

```
core/ai/
├── interfaces/
│   ├── cv-analysis-result.interface.ts
│   ├── generated-question.interface.ts
│   ├── answer-evaluation-result.interface.ts
│   └── session-summary-result.interface.ts
│
└── models/
    ├── ai-evaluation.model.ts         ← Matches backend AiEvaluation document
    └── interview-metrics.model.ts     ← Matches backend InterviewMetrics document
```

**Why no `AIService` on the frontend:**  
The frontend never calls the AI provider. All AI operations happen on the backend. The frontend sends HTTP requests to backend endpoints (`POST /answers`, `POST /cv/upload`). The backend internally calls `AIService`. The frontend only needs typed interfaces to correctly type the responses.

### 22.3 Updates to `features/interview/`

The interview feature page uses `SpeechFacadeService` for all voice interactions.

```
features/interview/
├── components/
│   ├── question-display/
│   │   └── question-display.component.ts     ← UNCHANGED
│   ├── transcript-display/
│   │   ├── transcript-display.component.ts   ← UPDATED: shows interim + final separately
│   │   └── transcript-display.component.html
│   ├── waveform/
│   │   ├── waveform.component.ts             ← NEW: uses AnalyserNode from AudioRecorderService
│   │   └── waveform.component.html
│   ├── session-timer/
│   │   └── session-timer.component.ts        ← UNCHANGED
│   ├── answer-actions/
│   │   ├── answer-actions.component.ts       ← UPDATED: wired to SpeechFacadeService
│   │   └── answer-actions.component.html
│   ├── metrics-summary/
│   │   └── metrics-summary.component.ts      ← UPDATED: displays ai_evaluation fields
│   └── permission-prompt/
│       └── permission-prompt.component.ts    ← NEW: shown when permissionState === 'DENIED'
```

#### `TranscriptDisplayComponent` (Updated)

```typescript
// features/interview/components/transcript-display/transcript-display.component.ts

@Component({
  selector: 'il-transcript-display',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="transcript-container font-mono text-sm">
      @if (isRecording()) {
        <!-- Real-time display -->
        <p class="text-gray-800 leading-relaxed">
          {{ finalText() }}
          <span class="text-gray-400 italic">{{ interimText() }}</span>
        </p>
        <div class="recording-indicator">
          <span class="pulse-dot"></span>
          <span>{{ wordCount() }} words</span>
          <span>{{ duration() | duration }}</span>
        </div>
      } @else if (finalText()) {
        <!-- Completed transcript -->
        <p class="text-gray-800 leading-relaxed" [innerHTML]="finalText() | fillerHighlight"></p>
        <div class="transcript-stats">
          <span>{{ wordCount() }} words</span>
        </div>
      } @else {
        <p class="text-gray-400 italic">Your answer will appear here as you speak...</p>
      }
    </div>
  `,
})
export class TranscriptDisplayComponent {
  @Input() finalText = input.required<string>();
  @Input() interimText = input.required<string>();
  @Input() isRecording = input.required<boolean>();
  @Input() duration = input.required<number>();

  readonly wordCount = computed(() =>
    this.finalText().trim() ? this.finalText().trim().split(/\s+/).length : 0,
  );
}
```

#### `WaveformComponent` (New)

```typescript
// features/interview/components/waveform/waveform.component.ts

@Component({
  selector: 'il-waveform',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #canvas class="w-full h-16"></canvas>`,
})
export class WaveformComponent implements OnChanges, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() analyserNode = input<AnalyserNode | null>(null);
  @Input() isActive = input<boolean>(false);

  private _animationFrameId: number | null = null;

  ngOnChanges(): void {
    if (this.isActive() && this.analyserNode()) {
      this._startAnimation();
    } else {
      this._stopAnimation();
    }
  }

  ngOnDestroy(): void {
    this._stopAnimation();
  }

  private _startAnimation(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    const analyser = this.analyserNode()!;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      this._animationFrameId = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2;

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
  }

  private _stopAnimation(): void {
    if (this._animationFrameId) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }
  }
}
```

#### `PermissionPromptComponent` (New)

```typescript
// features/interview/components/permission-prompt/permission-prompt.component.ts

@Component({
  selector: 'il-permission-prompt',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="permission-card">
      <mat-icon class="text-4xl text-amber-500">mic_off</mat-icon>
      <h3>{{ 'PERMISSION.TITLE' | translate }}</h3>
      <p>{{ 'PERMISSION.DESCRIPTION' | translate }}</p>
      @if (isDenied()) {
        <p class="text-red-500 text-sm">{{ 'PERMISSION.DENIED_HELP' | translate }}</p>
        <a [href]="browserSettingsLink" target="_blank" mat-button>
          {{ 'PERMISSION.OPEN_SETTINGS' | translate }}
        </a>
      } @else {
        <button mat-raised-button color="primary" (click)="onRequest.emit()">
          <mat-icon>mic</mat-icon>
          {{ 'PERMISSION.ALLOW_BUTTON' | translate }}
        </button>
      }
    </div>
  `,
})
export class PermissionPromptComponent {
  @Input() permissionState = input.required<PermissionState>();
  @Output() onRequest = output<void>();

  readonly isDenied = computed(() => this.permissionState() === 'DENIED');
  readonly browserSettingsLink = this._detectBrowserSettingsLink();

  private _detectBrowserSettingsLink(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'chrome://settings/content/microphone';
    if (ua.includes('Firefox')) return 'about:preferences#privacy';
    return '';
  }
}
```

### 22.4 Updates to `core/store/` — ActiveInterviewStore

The `ActiveInterviewStore` is updated to include speech state:

```typescript
export interface ActiveInterviewState {
  sessionId: string | null;
  interview: Interview | null;
  questions: Question[];
  currentQuestionIndex: number;
  currentQuestion: Question | null;

  // Answer tracking per question
  answers: Map<string, SubmittedAnswer>; // questionId → answer

  // Session timing
  startedAt: Date | null;
  elapsedSeconds: number;

  // NEW: Speech coordination flags
  speechState: SpeechState;
  isAwaitingEvaluation: boolean; // true while backend processes answer

  loading: boolean;
  error: string | null;
}
```

---

# PART 4 — BACKEND UPDATE

## 23. Backend Update — NestJS Architecture

### 23.1 Complete AI Module Structure

```
modules/ai/
├── ai.module.ts
├── ai.errors.ts
│
├── interfaces/
│   ├── ai-provider.interface.ts       ← IAIProvider (Port)
│   ├── ai-inputs.interface.ts         ← CvAnalysisInput, QuestionGenerationInput, etc.
│   └── ai-results.interface.ts        ← CvAnalysisResult, AnswerEvaluationResult, etc.
│
├── providers/
│   ├── gemini.provider.ts             ← GeminiProvider implements IAIProvider
│   ├── openai.provider.ts             ← (stub — uncomment when needed)
│   └── index.ts
│
├── prompts/
│   ├── prompt-registry.service.ts     ← PromptRegistryService
│   ├── cv-analysis/
│   │   └── cv-analysis-v1.prompt.ts
│   ├── question-generation/
│   │   └── question-generation-v1.prompt.ts
│   ├── answer-evaluation/
│   │   └── answer-evaluation-v1.prompt.ts
│   └── session-summary/
│       └── session-summary-v1.prompt.ts
│
├── services/
│   ├── ai.service.ts                  ← Public facade (the ONLY export)
│   ├── prompt-builder.service.ts      ← PromptBuilderService
│   ├── context-manager.service.ts     ← ContextManagerService (in-memory)
│   └── retry-executor.service.ts      ← RetryExecutorService
│
├── exceptions/
│   ├── ai.errors.ts                   ← AI_ERRORS constant map
│   ├── ai-provider.error.ts           ← AITimeoutError, AIParseError, AIProviderError
│   └── index.ts
│
└── tokens/
    └── ai-provider.token.ts           ← AI_PROVIDER_TOKEN = Symbol('AI_PROVIDER_TOKEN')
```

### 23.2 Answer Module Update — Orchestration

The `AnswerService` is the orchestrator that coordinates metrics (deterministic) and AI evaluation (generative). This is explicitly where the two systems meet.

```typescript
// modules/answer/services/answer.service.ts

@Injectable()
export class AnswerService {
  constructor(
    private readonly _answerRepository: AnswerRepository,
    private readonly _questionRepository: QuestionRepository,
    private readonly _metricsService: MetricsService,
    private readonly _aiService: AIService,
    private readonly _storageService: StorageService,
    private readonly _interviewService: InterviewService,
    private readonly _profileService: CandidateProfileService,
    private readonly _logger: Logger,
  ) {}

  async submit(
    userId: string,
    interviewId: string,
    dto: SubmitAnswerDto,
  ): Promise<SubmitAnswerResponse> {
    // 1. Validate question belongs to session
    const question = await this._questionRepository.findById(dto.questionId);
    if (!question || question.interviewId.toString() !== interviewId) {
      AppException.throw(ANSWER_ERRORS.INVALID_QUESTION);
    }

    // 2. Store audio file (if provided)
    let audioUrl: string | undefined;
    if (dto.audioBlob) {
      audioUrl = await this._storageService.store(dto.audioBlob, `answers/${interviewId}`);
    }

    // 3. Create answer document
    const answer = await this._answerRepository.create({
      questionId: dto.questionId,
      interviewId,
      userId,
      transcript: dto.transcript,
      audioUrl,
      durationSeconds: dto.durationSeconds,
    });

    // 4. Run BOTH systems in parallel — they are independent
    const profile = await this._profileService.findByUserId(userId);

    const [metrics, evaluation] = await Promise.allSettled([
      // DETERMINISTIC: no AI involved
      this._metricsService.compute(answer.id, dto.transcript, dto.durationSeconds),

      // GENERATIVE: AI involved
      this._aiService.evaluateAnswer(
        { text: question.text, type: question.type },
        dto.transcript,
        interviewId, // sessionId for context management
      ),
    ]);

    // 5. Handle partial failures gracefully
    const metricsResult = metrics.status === 'fulfilled' ? metrics.value : null;
    const evaluationResult = evaluation.status === 'fulfilled' ? evaluation.value : null;

    if (metrics.status === 'rejected') {
      this._logger.error('Metrics computation failed', metrics.reason);
    }
    if (evaluation.status === 'rejected') {
      this._logger.error('AI evaluation failed', evaluation.reason);
    }

    // 6. Advance session to next question
    await this._interviewService.advanceQuestion(interviewId);

    return { answer, metrics: metricsResult, evaluation: evaluationResult };
  }
}
```

**Why `Promise.allSettled` instead of `Promise.all`:**  
`Promise.all` would fail the entire submission if either metrics or AI evaluation throws. With `Promise.allSettled`, a Gemini outage does not prevent the answer from being saved. The answer is stored. Metrics are stored. The AI evaluation is stored as `null`. The session continues. The user can still complete their interview — their transcript is safe.

**Why metrics and evaluation run in parallel:**  
They have zero dependency on each other. Running them sequentially would double the latency of answer submission. A user waiting for feedback after speaking would wait 5s (metrics ~10ms + AI ~5s) instead of just 5s (both in parallel).

### 23.3 Speech Module (Backend)

The backend speech module does NOT handle speech recognition (that's a browser concern). It handles the **server-side coordination** after a spoken answer is submitted.

```
modules/speech/
├── speech.module.ts
├── speech.errors.ts
│
├── controllers/
│   └── speech.controller.ts          ← POST /speech/audio-upload (multipart)
│
├── services/
│   └── speech.service.ts             ← Validates and stores audio; returns audioUrl
│
└── dtos/
    └── upload-audio.dto.ts
```

```typescript
// modules/speech/services/speech.service.ts

@Injectable()
export class SpeechService {
  constructor(
    private readonly _storageService: StorageService,
    private readonly _logger: Logger,
  ) {}

  /**
   * Store the audio blob and return its URL.
   * Called by AnswerService when processing a submitted answer.
   * This is the ONLY backend speech responsibility.
   */
  async storeAudio(audioBlob: Buffer, interviewId: string, questionId: string): Promise<string> {
    const filename = `${interviewId}/${questionId}_${Date.now()}.webm`;
    const url = await this._storageService.store(audioBlob, filename);
    this._logger.log(`[storeAudio] Stored audio: ${filename}`);
    return url;
  }
}
```

**What the backend Speech module IS responsible for:**
- Receiving multipart audio data from the frontend
- Validating file size (max 50MB), mime type (audio/webm, audio/ogg, audio/mp4)
- Storing the audio file via `StorageService`
- Returning the permanent audio URL

**What the backend Speech module is NOT responsible for:**
- Speech recognition (this is a browser operation)
- Transcript generation (sent by the frontend in the DTO)
- Any AI processing

### 23.4 Metrics Module Update

The Metrics module is unchanged from v1.0 in its responsibility. But its internal structure is now fully specified:

```
modules/metrics/
├── metrics.module.ts
├── metrics.errors.ts
│
├── controllers/
│   └── metrics.controller.ts          ← GET /interviews/:id/metrics
│
├── repositories/
│   └── metrics.repository.ts
│
├── schemas/
│   └── interview-metrics.schema.ts
│
├── services/
│   └── metrics.service.ts             ← Orchestrates: tokenize → compute → store
│
├── constants/
│   ├── filler-words.constant.ts       ← FILLER_WORDS array (English + French)
│   └── metrics-thresholds.constant.ts ← Default WPM min/max, pause thresholds
│
└── utils/
    ├── speech-metrics.utils.ts        ← computeWPM, computeVocabularyRichness
    ├── filler-detection.utils.ts      ← detectFillerWords, countFillerWords
    ├── repetition-detection.utils.ts  ← detectRepeatedWords
    └── tokenizer.utils.ts             ← tokenize(transcript): string[]
```

```typescript
// modules/metrics/utils/tokenizer.utils.ts

/**
 * Tokenize a transcript into an array of lowercase words.
 * Pure function — no dependencies.
 */
export function tokenize(transcript: string): string[] {
  return transcript
    .toLowerCase()
    .replace(/[^\w\s'-]/g, '')      // Keep apostrophes (it's) and hyphens (well-structured)
    .replace(/\s+/g, ' ')           // Normalize whitespace
    .trim()
    .split(' ')
    .filter(Boolean);
}

// modules/metrics/utils/speech-metrics.utils.ts

export function computeWPM(wordCount: number, durationSeconds: number): number {
  if (durationSeconds <= 0) return 0;
  return Math.round((wordCount / durationSeconds) * 60);
}

export function computeVocabularyRichness(words: string[]): number {
  if (words.length === 0) return 0;
  const uniqueCount = new Set(words).size;
  return parseFloat((uniqueCount / words.length).toFixed(3));
}

// modules/metrics/utils/filler-detection.utils.ts

export function detectFillerWords(words: string[], fillerList: string[]): string[] {
  const fillerSet = new Set(fillerList.map(f => f.toLowerCase()));
  return words.filter(w => fillerSet.has(w));
}

export function countFillerWords(words: string[], fillerList: string[]): number {
  return detectFillerWords(words, fillerList).length;
}

// modules/metrics/utils/repetition-detection.utils.ts

/**
 * Detect words repeated within a sliding window of N words.
 * A word is "repeated" if it appears more than once within the window.
 * Ignores stopwords (the, a, is, etc.).
 */
export function detectRepeatedWords(words: string[], windowSize: number = 20): string[] {
  const STOP_WORDS = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'of', 'and', 'or', 'in', 'on', 'at', 'for', 'with', 'that', 'this', 'it', 'i', 'we', 'you', 'he', 'she', 'they']);
  const repeated = new Set<string>();

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (STOP_WORDS.has(word) || word.length < 4) continue;

    const window = words.slice(i + 1, i + windowSize);
    if (window.includes(word)) {
      repeated.add(word);
    }
  }

  return [...repeated];
}
```

---

## 24. Module Responsibility Matrix

### 24.1 Backend Modules

| Module | MUST DO | MUST NEVER DO |
|---|---|---|
| `ai` | Provide AI operations via `AIService`. Manage prompt versioning. Retry failed calls. Handle timeout. Parse AI responses. | Import business domain modules. Know what an "interview" or "answer" is. Call speech services. Compute deterministic metrics. |
| `metrics` | Compute speech metrics using pure algorithms. Store results in `interview_metrics`. Provide aggregate metrics for session summary. | Call AI. Use async external services. Import the `ai` module. Depend on speech services. |
| `speech` | Receive audio blobs via multipart. Validate audio format and size. Store audio via `StorageService`. Return audio URL. | Perform speech recognition. Call AI. Compute metrics. Know about question or answer business logic. |
| `answer` | Orchestrate: receive submission, store answer, trigger metrics + AI evaluation in parallel, advance session question. | Perform direct AI calls (must use `AIService`). Compute metrics directly (must use `MetricsService`). Store audio directly (must use `SpeechService`). |
| `interview` | Create sessions. Generate questions via `AIService`. Track session state (PENDING → IN_PROGRESS → COMPLETED). Generate session summary. | Evaluate individual answers. Compute metrics. Handle audio. Know about the transcript content. |
| `cv` | Receive uploaded files. Extract text from PDF/DOCX. Trigger CV analysis via `AIService`. Update candidate profile. | Directly access the Gemini SDK. Know about questions or sessions. |
| `candidate-profile` | Own the profile document. Expose profile context to other modules. Track CV analysis status. | Generate questions. Evaluate answers. Know about AI providers. |
| `question` | Create, list, and advance questions within a session. Expose question text to other modules. | Evaluate answers. Score users. Compute metrics. |
| `auth` | Register, login, logout. Session management. JWT issuance. Password hashing. | Profile management. Know about interviews. Generate questions. |
| `users` | User CRUD. Language preference. | Authentication. Profile management. Interview logic. |
| `storage` | Abstract file storage (local/S3). Receive bytes/buffer, return URL. | Know what the stored file represents (audio, CV). Apply business rules to stored content. |
| `notification` | Create notification documents. Mark as read. | Send emails. Push notifications. Know about interview scoring. |
| `settings` | User settings CRUD. | Apply settings logic (e.g., language sync is done by `SpeechLanguageService` on the frontend). |

### 24.2 Frontend Services

| Service | MUST DO | MUST NEVER DO |
|---|---|---|
| `SpeechFacadeService` | Coordinate all speech operations. Expose a clean API (start, stop, reset). Surface speech state signals. | Call AI. Call backend directly. Manage navigation. Know about question business logic. |
| `AudioRecorderService` | MediaRecorder lifecycle: start, stop, collect chunks, produce Blob. Provide AnalyserNode for waveform. | Know about transcripts. Call the backend. Manage permissions. |
| `SpeechRecognitionService` | Web Speech API lifecycle. Accumulate transcript. Handle auto-restart. | Know about audio recording. Call the backend. Know about interview logic. |
| `TranscriptValidationService` | Validate transcript strings. Return typed result with error codes. | Know about audio. Call the backend. Call AI. |
| `SpeechPermissionsService` | Manage microphone permission state. Request permission. Cache stream. Observe permission changes. | Know about transcripts or recordings. Call the backend. |
| `SpeechLanguageService` | Manage active speech recognition language. Sync with user settings. | Know about recording. Know about transcript content. Call the backend. |
| `AuthStore` | Maintain authenticated user state. Login/logout. Token management. | Know about interviews or profiles. Call AI. |
| `ActiveInterviewStore` | Track active session state: current question, elapsed timer, speech state, submitted answers. | Know about speech recognition internals. Call AI directly. |
| `InterviewApiService` | HTTP calls for interview domain: create session, submit answer, complete session. | Know about speech internals. Compute metrics locally. |

---

# PART 5 — COMMUNICATION ARCHITECTURE

## 25. Communication Architecture

### 25.1 Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    ANGULAR FRONTEND                         │
│                                                             │
│  [InterviewSessionPage]                                     │
│       │ reads signals                                       │
│       ├──────────────► [SpeechFacadeService] (core/speech/) │
│       │                    │ coordinates                    │
│       │                    ├── AudioRecorderService         │
│       │                    ├── SpeechRecognitionService     │
│       │                    ├── TranscriptValidationService  │
│       │                    ├── SpeechPermissionsService     │
│       │                    └── SpeechLanguageService        │
│       │                                                     │
│       ├──────────────► [ActiveInterviewStore]               │
│       │                                                     │
│       └──────────────► [InterviewApiService]                │
│                            │ HTTP POST /answers             │
└────────────────────────────┼────────────────────────────────┘
                             │
                    HTTPS + JSON + multipart
                             │
┌────────────────────────────▼────────────────────────────────┐
│                   NESTJS BACKEND                            │
│                                                             │
│  [AnswerController] → [AnswerService]                       │
│                            │                               │
│               ┌────────────┼────────────┐                  │
│               ▼            ▼            ▼                  │
│        [MetricsService] [AIService] [SpeechService]        │
│               │            │            │                  │
│               │     [IAIProvider]  [StorageService]        │
│               │            │                               │
│         [interview_metrics] [GeminiProvider]               │
│                             │                              │
└─────────────────────────────┼──────────────────────────────┘
                              │
                        HTTPS (REST)
                              │
                    ┌─────────▼────────┐
                    │  Gemini API      │
                    └──────────────────┘
```

### 25.2 Answer Submission Sequence Diagram

```
User             SpeechFacade    InterviewPage    AnswerApiSvc    Backend         Gemini
  │                   │               │               │              │               │
  │ clicks Stop       │               │               │              │               │
  │──────────────────►│               │               │              │               │
  │                   │ stop()        │               │              │               │
  │                   │ returns SpeechResult           │              │               │
  │                   │──────────────►│               │              │               │
  │                   │               │               │              │               │
  │                   │               │ validate()    │              │               │
  │                   │               │ (client-side) │              │               │
  │                   │               │               │              │               │
  │                   │               │ submitAnswer()│              │               │
  │                   │               │──────────────►│              │               │
  │                   │               │               │              │               │
  │                   │               │               │ POST /answers│               │
  │                   │               │               │─────────────►│               │
  │                   │               │               │              │               │
  │                   │               │               │              │ store audio   │
  │                   │               │               │              │ (StorageSvc)  │
  │                   │               │               │              │               │
  │                   │               │               │              │ MetricsService│
  │                   │               │               │              │ (parallel) ──►│
  │                   │               │               │              │ (no AI)       │
  │                   │               │               │              │               │
  │                   │               │               │              │ AIService ────────────►│
  │                   │               │               │              │ evaluateAnswer│         │
  │                   │               │               │              │               │ Gemini  │
  │                   │               │               │              │               │◄────────│
  │                   │               │               │              │               │
  │                   │               │               │◄─────────────│               │
  │                   │               │               │  Response:   │               │
  │                   │               │               │  {answer,    │               │
  │                   │               │               │   metrics,   │               │
  │                   │               │               │   evaluation}│               │
  │                   │               │◄──────────────│               │               │
  │                   │               │               │              │               │
  │◄──────────────────────────────────│               │              │               │
  │ sees results      │               │               │              │               │
```

### 25.3 CV Upload and AI Analysis Sequence Diagram

```
User          ProfilePage     CvUploadComp    ProfileApiSvc   Backend(CV)   Backend(AI)    Gemini
  │               │               │               │               │              │             │
  │ selects file  │               │               │               │              │             │
  │──────────────►│               │               │               │              │             │
  │               │ file input    │               │               │              │             │
  │               │──────────────►│               │               │              │             │
  │               │               │ validate()    │               │              │             │
  │               │               │ (type, size)  │               │              │             │
  │               │               │               │               │              │             │
  │               │               │ uploadCv()    │               │              │             │
  │               │               │──────────────►│               │              │             │
  │               │               │               │ POST /cv/upload│              │             │
  │               │               │               │──────────────►│              │             │
  │               │               │               │               │ store file   │             │
  │               │               │               │               │ (StorageSvc) │             │
  │               │               │               │               │              │             │
  │               │               │               │               │ extractText  │             │
  │               │               │               │               │ (CvParser)   │             │
  │               │               │               │               │              │             │
  │               │               │               │               │ profile.status=PENDING      │
  │               │               │               │               │              │             │
  │               │               │               │◄──────────────│              │             │
  │               │               │◄──────────────│ {status:PENDING}             │             │
  │               │               │               │               │              │             │
  │               │               │               │               │ AIService    │             │
  │               │               │               │               │ analyzeCv()──────────────► │
  │               │               │               │               │              │ (async)     │
  │               │               │               │               │              │◄────────────│
  │               │               │               │               │ profile.status=COMPLETED    │
  │               │               │               │               │ NotificationService.create()│
  │               │               │               │               │              │             │
  │ (polls GET /candidate-profile or receives notification)       │              │             │
  │◄─────────────────────────────────────────────│               │              │             │
  │ sees profile  │               │               │               │              │             │
```

### 25.4 Speech Permission Sequence Diagram

```
User        InterviewSetupPage    SpeechFacade    PermissionsSvc    Browser
  │               │                   │               │                │
  │ clicks        │                   │               │                │
  │ "Start Session│                   │               │                │
  │──────────────►│                   │               │                │
  │               │ navigate to       │               │                │
  │               │ /interview/session│               │                │
  │               │                   │               │                │
  │               │ [InterviewSession  │               │                │
  │               │  Page initializes]│               │                │
  │               │──────────────────►│               │                │
  │               │                   │ checkPermission│               │
  │               │                   │──────────────►│                │
  │               │                   │               │ navigator.     │
  │               │                   │               │ permissions    │
  │               │                   │               │ .query()──────►│
  │               │                   │               │◄───────────────│
  │               │                   │               │  state='prompt'│
  │               │                   │               │                │
  │               │◄──────────────────│ permState=PROMPT               │
  │               │ shows PermissionPromptComponent    │                │
  │◄──────────────│                   │               │                │
  │ sees permission│                  │               │                │
  │ dialog UI     │                   │               │                │
  │               │                   │               │                │
  │ clicks        │                   │               │                │
  │ "Allow Mic"   │                   │               │                │
  │──────────────►│                   │               │                │
  │               │ requestPermission()               │                │
  │               │──────────────────►│               │                │
  │               │                   │ requestPermission()            │
  │               │                   │──────────────►│                │
  │               │                   │               │ getUserMedia() │
  │               │                   │               │───────────────►│
  │               │                   │               │ [browser dialog│
  │               │                   │               │  shown to user]│
  │ clicks        │                   │               │                │
  │ "Allow" in    │                   │               │                │
  │ browser dialog│                   │               │                │
  │──────────────────────────────────────────────────────────────────►│
  │               │                   │               │◄───────────────│
  │               │                   │               │ stream granted │
  │               │                   │◄──────────────│                │
  │               │                   │ permState=GRANTED              │
  │               │◄──────────────────│               │                │
  │               │ hides PermissionPrompt             │                │
  │               │ shows RecordingInterface           │                │
  │◄──────────────│                   │               │                │
  │ sees recording│                   │               │                │
  │ UI, ready     │                   │               │                │
```

---

## 26. Updated Folder Trees

### 26.1 Complete Backend Folder Tree (v2.0)

Changes from v1.0 are marked with `[NEW]` or `[UPDATED]`.

```
backend/src/
├── main.ts
├── app.module.ts
├── app.controller.ts
│
├── config/
│   ├── configuration.ts                     [UPDATED] — AI config section added
│   ├── environment.ts
│   └── environment.prod.ts
│
├── core/
│   ├── core.module.ts
│   ├── alerting/
│   ├── constants/
│   ├── decorators/
│   ├── exceptions/
│   ├── guards/
│   ├── interceptors/
│   ├── models/
│   ├── pipes/
│   ├── repository/
│   ├── services/
│   ├── tokens/
│   ├── types/
│   └── utils/
│
├── modules/
│   │
│   ├── ai/                                  [FULLY EXPANDED in v2.0]
│   │   ├── ai.module.ts
│   │   ├── interfaces/
│   │   │   ├── ai-provider.interface.ts     ← IAIProvider
│   │   │   ├── ai-inputs.interface.ts       ← All input types
│   │   │   └── ai-results.interface.ts      ← All result types
│   │   ├── providers/
│   │   │   ├── gemini.provider.ts           ← GeminiProvider
│   │   │   └── openai.provider.ts           ← Stub (inactive)
│   │   ├── prompts/
│   │   │   ├── prompt-registry.service.ts
│   │   │   ├── cv-analysis/
│   │   │   │   └── cv-analysis-v1.prompt.ts
│   │   │   ├── question-generation/
│   │   │   │   └── question-generation-v1.prompt.ts
│   │   │   ├── answer-evaluation/
│   │   │   │   └── answer-evaluation-v1.prompt.ts
│   │   │   └── session-summary/
│   │   │       └── session-summary-v1.prompt.ts
│   │   ├── services/
│   │   │   ├── ai.service.ts
│   │   │   ├── prompt-builder.service.ts
│   │   │   ├── context-manager.service.ts
│   │   │   └── retry-executor.service.ts
│   │   ├── exceptions/
│   │   │   ├── ai.errors.ts
│   │   │   └── ai-provider.error.ts
│   │   └── tokens/
│   │       └── ai-provider.token.ts
│   │
│   ├── speech/                              [NEW in v2.0]
│   │   ├── speech.module.ts
│   │   ├── speech.errors.ts
│   │   ├── controllers/
│   │   │   └── speech.controller.ts        ← POST /speech/audio (multipart)
│   │   ├── services/
│   │   │   └── speech.service.ts           ← Audio storage orchestration
│   │   └── dtos/
│   │       └── upload-audio.dto.ts
│   │
│   ├── metrics/                             [FULLY EXPANDED in v2.0]
│   │   ├── metrics.module.ts
│   │   ├── metrics.errors.ts
│   │   ├── controllers/
│   │   │   └── metrics.controller.ts
│   │   ├── repositories/
│   │   │   └── metrics.repository.ts
│   │   ├── schemas/
│   │   │   └── interview-metrics.schema.ts
│   │   ├── services/
│   │   │   └── metrics.service.ts
│   │   ├── constants/
│   │   │   ├── filler-words.constant.ts    ← EN + FR filler word lists
│   │   │   └── metrics-thresholds.constant.ts
│   │   └── utils/
│   │       ├── tokenizer.utils.ts
│   │       ├── speech-metrics.utils.ts     ← computeWPM, computeVocabularyRichness
│   │       ├── filler-detection.utils.ts
│   │       └── repetition-detection.utils.ts
│   │
│   ├── answer/                              [UPDATED — parallel metrics+AI]
│   │   ├── answer.module.ts
│   │   ├── answer.errors.ts
│   │   ├── controllers/
│   │   │   └── answer.controller.ts
│   │   ├── repositories/
│   │   │   └── answer.repository.ts
│   │   ├── schemas/
│   │   │   └── answer.schema.ts
│   │   ├── services/
│   │   │   └── answer.service.ts           [UPDATED] — Promise.allSettled pattern
│   │   └── dtos/
│   │       └── submit-answer.dto.ts
│   │
│   ├── auth/          (unchanged)
│   ├── users/         (unchanged)
│   ├── candidate-profile/ (unchanged)
│   ├── cv/            (unchanged)
│   ├── interview/     (unchanged)
│   ├── question/      (unchanged)
│   ├── notification/  (unchanged)
│   └── settings/      (unchanged)
│
└── shared/
    └── constants/
        └── app.constants.ts
```

### 26.2 Complete Frontend Folder Tree (v2.0)

```
frontend/src/app/
├── app.component.ts
├── app.config.ts
├── app.routes.ts
│
├── layout/
│   ├── main-layout.component.ts
│   ├── sidebar.component.ts
│   ├── header.component.ts
│   └── auth-layout.component.ts
│
├── core/
│   ├── auth/                     (unchanged from v1.0)
│   │
│   ├── http/                     (unchanged from v1.0)
│   │
│   ├── models/                   (unchanged from v1.0)
│   │
│   ├── ai/                       [NEW in v2.0 — frontend AI interfaces only]
│   │   ├── interfaces/
│   │   │   ├── cv-analysis-result.interface.ts
│   │   │   ├── generated-question.interface.ts
│   │   │   ├── answer-evaluation-result.interface.ts
│   │   │   └── session-summary-result.interface.ts
│   │   └── models/
│   │       ├── ai-evaluation.model.ts
│   │       └── interview-metrics.model.ts
│   │
│   ├── speech/                   [NEW in v2.0 — FULLY SPECIFIED]
│   │   ├── interfaces/
│   │   │   ├── speech-facade.interface.ts  ← ISpeechFacade, SpeechResult, SpeechState
│   │   │   └── speech-language.interface.ts← SpeechLanguage
│   │   ├── services/
│   │   │   ├── speech-facade.service.ts    ← Main coordinator
│   │   │   ├── audio-recorder.service.ts   ← MediaRecorder wrapper
│   │   │   ├── speech-recognition.service.ts ← Web Speech API wrapper
│   │   │   ├── transcript-validation.service.ts
│   │   │   ├── speech-permissions.service.ts
│   │   │   └── speech-language.service.ts
│   │   ├── errors/
│   │   │   └── speech.error.ts             ← SpeechError + SpeechErrorCode
│   │   └── constants/
│   │       └── speech-languages.constant.ts
│   │
│   ├── store/
│   │   ├── base.store.ts
│   │   ├── list.store.ts
│   │   └── active-interview.store.ts       [UPDATED] — speechState added
│   │
│   ├── notification/
│   │   └── notification.service.ts
│   │
│   └── utils/
│       ├── date.utils.ts
│       ├── string.utils.ts
│       ├── audio.utils.ts
│       └── transcript.utils.ts
│
├── shared/
│   ├── components/
│   │   ├── waveform/
│   │   │   └── waveform.component.ts       [NEW — Canvas waveform via AnalyserNode]
│   │   ├── score-gauge/
│   │   ├── metrics-chart/
│   │   ├── base-table/
│   │   ├── empty-state/
│   │   ├── loading-spinner/
│   │   ├── confirm-dialog/
│   │   └── card/
│   │
│   ├── directives/
│   ├── pipes/
│   │   ├── duration.pipe.ts
│   │   ├── score.pipe.ts
│   │   ├── relative-date.pipe.ts
│   │   └── filler-highlight.pipe.ts        (unchanged)
│   │
│   └── validators/
│
└── features/
    ├── auth/            (unchanged)
    ├── dashboard/       (unchanged)
    ├── profile/         (unchanged)
    │
    ├── interview/                           [UPDATED in v2.0]
    │   ├── interview.routes.ts
    │   ├── pages/
    │   │   ├── interview-setup/
    │   │   ├── interview-session/
    │   │   │   ├── interview-session.page.ts [UPDATED — SpeechFacade integration]
    │   │   │   └── interview-session.store.ts
    │   │   └── interview-results/
    │   ├── components/
    │   │   ├── question-display/
    │   │   ├── transcript-display/          [UPDATED — interim + final display]
    │   │   │   └── transcript-display.component.ts
    │   │   ├── waveform/                    [PROMOTED from shared — interview-specific]
    │   │   │   └── waveform.component.ts
    │   │   ├── session-timer/
    │   │   ├── answer-actions/              [UPDATED — wired to SpeechFacade]
    │   │   │   └── answer-actions.component.ts
    │   │   ├── metrics-summary/             [UPDATED — ai_evaluation fields]
    │   │   │   └── metrics-summary.component.ts
    │   │   └── permission-prompt/           [NEW — microphone permission UI]
    │   │       └── permission-prompt.component.ts
    │   └── services/
    │       └── interview.api.service.ts
    │
    ├── history/         (unchanged)
    ├── analytics/       (unchanged)
    └── settings/        (unchanged)
```

---

## 27. Updated Dependency Diagrams

### 27.1 Backend Module Dependency Graph (v2.0)

```
                    ┌─────────────────────┐
                    │    CoreModule        │ @Global()
                    │  BaseRepository<T>   │
                    │  GlobalExceptionFilter│
                    │  JwtAuthGuard        │
                    └──────────┬──────────┘
                               │ available to all
        ┌──────────────────────┼───────────────────────────┐
        ▼                      ▼                           ▼
  ┌──────────┐         ┌──────────────┐           ┌─────────────────┐
  │   auth   │         │   storage    │           │    ai           │
  │ (exports │         │ (exports     │           │ (exports        │
  │  users)  │         │  StorageSvc) │           │  AIService ONLY)│
  └────┬─────┘         └──────┬───────┘           └────────┬────────┘
       │                      │                            │
       │                      │ ┌──────────────────────────┤
       ▼                      │ │                          │
  ┌──────────┐                │ │                          │
  │  users   │                │ │ imports AIService        │
  │ (exports │                │ │                          │
  │  UserSvc)│                │ │ ┌────────────────────────┘
  └────┬─────┘                │ │ │
       │                      │ │ │
       │                      ▼ ▼ ▼
       │               ┌──────────────────┐
       │               │ candidate-profile │
       │               │ (exports Profile  │
       ▼               │  Service)        │
  ┌──────────────────┐ └────────┬─────────┘
  │      cv          │          │
  │ imports: storage,│          │
  │   ai, profile    │          │
  └────┬─────────────┘          │
       │                        │
       │ profile update trigger │
       └────────────────────────┘
                                │
                    ┌───────────▼──────────────┐
                    │         interview         │
                    │  imports: profile, ai,    │
                    │    question               │
                    └───────────┬──────────────┘
                                │
                                ▼
                    ┌───────────────────────────┐
                    │          question          │
                    │  imports: interview        │
                    └───────────┬───────────────┘
                                │
                    ┌───────────▼───────────────┐
                    │          answer            │
                    │  imports: question,        │
                    │    interview, metrics, ai, │
                    │    speech, storage         │
                    └─────┬─────────┬───────────┘
                          │         │
              ┌───────────┘         └──────────────┐
              ▼                                    ▼
  ┌──────────────────┐                 ┌──────────────────┐
  │     metrics      │                 │     speech       │
  │  NO AI IMPORT    │                 │  imports storage │
  │  Pure algorithms │                 │  NO AI IMPORT    │
  └──────────────────┘                 └──────────────────┘
```

### 27.2 AI Module Internal Dependency Graph

```
                ┌──────────────┐
                │  AIService   │ ← Only thing exported
                └──────┬───────┘
                       │ depends on
        ┌──────────────┼──────────────────┐
        ▼              ▼                  ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
│PromptBuilder │ │ContextManager│ │  RetryExecutor   │
│   Service    │ │   Service    │ │    Service       │
└──────┬───────┘ └──────────────┘ └──────────────────┘
       │ uses
       ▼
┌──────────────────┐
│PromptRegistry    │
│   Service        │
└──────┬───────────┘
       │ contains
       ▼
┌──────────────────────────────────────────┐
│  Prompt Templates (versioned functions)  │
│  cv-analysis-v1 · question-gen-v1        │
│  answer-evaluation-v1 · session-summary-v1│
└──────────────────────────────────────────┘

AIService also depends on:
       │
       ▼
┌──────────────────┐
│ AI_PROVIDER_TOKEN│
│  (Symbol)        │
│       │          │
│       ▼          │
│  IAIProvider     │
│  (interface)     │
│       │          │
│       ▼          │
│ GeminiProvider   │
│ (only impl now)  │
└──────────────────┘
```

### 27.3 Frontend Speech Dependency Graph

```
        ┌───────────────────────────────────┐
        │     InterviewSessionPage          │
        │     (Smart Component)             │
        └───────────────┬───────────────────┘
                        │ injects ONE service
                        ▼
        ┌───────────────────────────────────┐
        │       SpeechFacadeService         │
        │       (Single entry point)        │
        └──────┬───────┬──────┬──────┬──────┘
               │       │      │      │
               ▼       ▼      ▼      ▼
 ┌─────────┐ ┌──────┐ ┌────┐ ┌──────────────┐
 │  Audio  │ │Speech│ │Val-│ │Permissions   │
 │Recorder │ │Recog-│ │ida-│ │   Service    │
 │ Service │ │nition│ │tion│ │              │
 └────┬────┘ │Svc   │ │Svc │ └──────┬───────┘
      │      └──────┘ └────┘        │
      │                              │
      │ provides AnalyserNode        │ provides MediaStream
      ▼                              ▼
┌──────────────┐            ┌──────────────────┐
│  Waveform    │            │  AudioRecorder   │
│  Component   │            │  Service (reuses │
│  (Canvas)    │            │  cached stream)  │
└──────────────┘            └──────────────────┘

SpeechFacadeService also injects:
┌──────────────────┐
│ SpeechLanguage   │
│    Service       │
│  (syncs with     │
│  UserSettings)   │
└──────────────────┘
```

---

## Architecture Rules — v2.0 Additions

### AI Rules (additions to v1.0 Rules 21–23)

**Rule AI-1:** The `GeminiProvider` (and any future provider) receives **only rendered prompt strings** as input. It never receives domain objects (`Interview`, `CandidateProfile`). The `PromptBuilderService` is responsible for the transformation.

**Rule AI-2:** Every prompt template function is a **pure function**: same inputs produce the same output. No randomness, no time dependency, no external calls within the template function itself.

**Rule AI-3:** When a new prompt version is created, the **previous version must be kept** in the registry with `active: false`. It must never be deleted until all production records referencing it have been audited.

**Rule AI-4:** The `ContextManagerService` in-memory store **must never exceed 500 active sessions**. If the limit is reached, the oldest sessions are evicted before adding new ones.

**Rule AI-5:** All AI operations **must be wrapped in `RetryExecutor` first, then `withTimeout`**. Timeout wraps the entire retry sequence. This order ensures no individual retry can run indefinitely.

**Rule AI-6:** The `AIService.evaluateAnswer()` method **must call `ContextManagerService.appendTurn()`** after a successful evaluation. It must NOT call it on error. Poisoning context with error-state turns would corrupt subsequent evaluations.

### Speech Rules (additions to v1.0)

**Rule SP-1:** The `SpeechFacadeService` is the **only speech service injected by feature components**. No component injects `AudioRecorderService`, `SpeechRecognitionService`, or `SpeechPermissionsService` directly.

**Rule SP-2:** `AudioRecorderService` **must never call `getUserMedia()`** directly. It receives a `MediaStream` from `SpeechPermissionsService`. This separation ensures permission management has a single owner.

**Rule SP-3:** `SpeechRecognitionService` **must accumulate transcript across auto-restarts**. The `_accumulatedFinal` field is the source of truth for the transcript. The signal-based `finalTranscript` always reflects `_accumulatedFinal`.

**Rule SP-4:** The `SpeechFacadeService.destroy()` method **must be called** in `ngOnDestroy` of the `InterviewSessionPage`. It stops all audio tracks, releases the microphone, and resets state. Failing to call it leaves the microphone active after navigation.

**Rule SP-5:** Speech errors are **displayed to the user in their app language** via `ngx-translate`. Speech error codes (`SpeechErrorCode`) are translated to human-readable strings. Raw error messages are never shown.

**Rule SP-6:** `TranscriptValidationService.validate()` is a **pure function with no side effects**. It receives a transcript string and duration, returns a validation result. It never modifies state or call any service.

---

*This document is Version 2.0 of the InterviewLab Architecture Blueprint.*  
*All decisions from Version 1.0 remain in effect.*  
*This document supersedes v1.0 only for the sections it covers (AI, Speech, updated folder trees, updated dependency graphs).*
