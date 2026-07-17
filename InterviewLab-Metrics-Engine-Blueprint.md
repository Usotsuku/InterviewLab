# InterviewLab — Metrics Engine Architecture Blueprint v1.0

> **Status**: Official Subsystem Blueprint  
> **Subsystem**: Metrics Engine  
> **Scope**: Deterministic Communication Analysis  
> **Prepared by**: Principal Software Architect  
> **AI Separation Constraint**: ZERO dependencies on Gemini or any LLM. 100% deterministic, reproducible, and verifiable.

---

## 1. Metrics Module Architecture

The Metrics Engine is designed as a self-contained, deterministic processing unit. It is responsible for analyzing the *delivery* (how the candidate speaks) using computational linguistics and timing algorithms, completely separated from the semantic analysis (what the candidate says) performed by the AI subsystem.

### 1.1 Folder Structure

#### Backend Module (`backend/src/modules/metrics/`)
```
modules/metrics/
├── metrics.module.ts                   ← Module registration and DI assembly
├── metrics.errors.ts                   ← Error definitions
├── controllers/
│   └── metrics.controller.ts           ← Endpoint for retrieving performance reports
├── repositories/
│   └── metrics.repository.ts           ← Database access layer for interview_metrics
├── schemas/
│   └── interview-metrics.schema.ts     ← Mongoose schema with indexes
├── services/
│   ├── metrics-engine.service.ts       ← Main pipeline runner (Facade)
│   ├── calculator-registry.service.ts  ← OCP Registry for metric calculators
│   └── metrics-config.service.ts       ← Dynamic thresholds manager
├── interfaces/
│   ├── calculator.interface.ts         ← IMetricCalculator interface
│   ├── pipeline.interface.ts           ← IPipelineContext & IPipelineStep
│   └── report.interface.ts             ← ICommunicationReport definition
├── calculators/                        ← Individual calculation strategies (Strategy Pattern)
│   ├── base-calculator.abstract.ts
│   ├── speaking-speed.calculator.ts
│   ├── pause-analyser.calculator.ts
│   ├── vocabulary.calculator.ts
│   ├── filler-words.calculator.ts
│   ├── confidence.calculator.ts
│   ├── communication.calculator.ts
│   └── final-score.calculator.ts
├── dictionaries/                       ← Multilingual dictionaries
│   ├── dictionary.manager.ts
│   ├── en.json
│   ├── fr.json
│   ├── es.json
│   ├── de.json
│   └── ar.json
└── utils/                              ← Helper utility functions
    ├── text-cleaner.util.ts
    └── statistics.util.ts
```

#### Frontend Module (`frontend/src/app/core/metrics/`)
```
core/metrics/
├── services/
│   └── metrics.service.ts              ← Connects to backend API, manages state signals
├── models/
│   ├── metrics.model.ts                ← Raw metrics data models
│   └── report.model.ts                 ← Communication report data models
└── components/                         ← Reusable visualization primitives
    ├── progress-line-chart/
    ├── radar-metrics-chart/
    └── metric-metric-card/
```

### 1.2 Interfaces

```typescript
// modules/metrics/interfaces/pipeline.interface.ts

export interface IPipelineContext {
  rawTranscript: string;
  normalizedTokens: string[];
  durationSeconds: number;
  pauseIntervals: IPauseInterval[];
  language: string;
  technicalScore?: number; // Provided by AI subsystem, consumed here for Final Score
  calculatedMetrics: Map<string, any>;
}

export interface IPauseInterval {
  startMs: number;
  endMs: number;
  durationMs: number;
}

export interface IPipelineStep {
  name: string;
  execute(context: IPipelineContext): Promise<IPipelineContext>;
}

// modules/metrics/interfaces/calculator.interface.ts

export interface IMetricCalculator {
  readonly metricName: string;
  readonly dependencies: string[];
  calculate(context: IPipelineContext): Promise<any>;
}
```

### 1.3 Dependency Flow

```
┌────────────────────────────────────────────────────────┐
│                     Answer Module                      │
│        (coordinates submission and storage)            │
└──────────────────────────┬─────────────────────────────┘
                           │ calls submit()
                           ▼
┌────────────────────────────────────────────────────────┐
│                   MetricsEngine                        │
│               (orchestrates pipeline)                  │
└──────┬───────────────────┬───────────────────────┬─────┘
       │                   │                       │
       ▼                   ▼                       ▼
┌──────────────┐   ┌───────────────┐       ┌─────────────┐
│ Text Cleaner │   │  Dictionary   │       │ Calculator  │
│  (Tokenizer) │   │    Manager    │       │  Registry   │
└──────────────┘   └───────────────┘       └──────┬──────┘
                                                  │
                                                  ▼
                                           IMetricCalculator
                                           (Strategy Pattern)
                                           ├── SpeakingSpeedCalculator
                                           ├── PauseCalculator
                                           └── [Other Calculators]
```

**Architectural Rule:** The `metrics` module has **zero dependencies** on the `ai` module. It does not import its services, guards, or types. The `answer` module acts as the coordinator, feeding the AI-generated `technicalScore` into the metrics pipeline as a parameter when executing final score calculations.

---

## 2. Transcript Processing Pipeline

The Transcript Processing Pipeline executes as a linear pipeline sequence (Pipeline Pattern) to transform raw input voice-to-text streams into a finalized communication score.

```
Raw Transcript + Audio Pauses
            │
            ▼
┌───────────────────────┐
│     Normalization     │  ← Lowers casing, standardizes contractions, maps pauses
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│     Tokenization      │  ← Text segmented into clean syntactic units (words)
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│  Registry Extraction  │  ← Calculators instantiated and dependency order resolved
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│  Metric Calculators   │  ← Calculators execute sequentially in dependency order
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│   Score Aggregation   │  ← Communication, Confidence, and Final Scores computed
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│   Report Generation   │  ← Formulates warnings, trends, and recommendations
└───────────────────────┘
```

### Pipeline Steps:

1. **Normalization:** Input transcripts are cleaned. Standardizes localized typography (e.g., curly apostrophes `’` to straight apostrophes `'`), converts to lowercase, and strips non-verbal elements (e.g., `[laughter]`, `(music)`).
2. **Tokenization:** Splits normalized text using boundary matching: `[^\w'-]`. Maintains structural hyphens and apostrophes to avoid splitting contractions (e.g., "don't" is calculated as one token, not two).
3. **Registry Extraction:** Evaluates active calculators against system configuration. Arranges execution based on dependencies (e.g., `ConfidenceCalculator` requires outputs from `SpeakingSpeedCalculator` and `FillerWordsCalculator`).
4. **Calculators Execution:** Metric values are mapped directly to `context.calculatedMetrics`.
5. **Score Aggregation:** Weighted combinations apply mathematical formulas to generate aggregated indices.
6. **Report Generation:** Generates warnings and suggestions based on threshold violations.

---

## 3. Metric Calculators

Each metric calculator implements the `IMetricCalculator` interface. The system uses the **Strategy Pattern** combined with a central **Registry Pattern** to resolve dependencies at runtime.

### 3.1 Single Responsibility Principle (SRP) enforcement

Every calculator handles exactly **one** concern:
*   `SpeakingSpeedCalculator` only computes words per minute.
*   `VocabularyRichnessCalculator` only evaluates token distributions.
*   `ConfidenceCalculator` only calculates the weighted combination of other metrics.

#### Why SRP is critical here:
1.  **Testability:** Each calculator can be unit tested with pure inputs. Mocking is restricted to `IPipelineContext` values.
2.  **Scalability:** Changing the algorithm of a single metric (e.g., swapping simple Type-Token Ratio for Herdan's C index) only impacts one class.
3.  **Extensibility:** Adding a new metric (e.g., "Grammar Complexity") requires writing a new calculator class and registering it. No existing codebase lines need adjustment.

### 3.2 Registry Pattern implementation

```typescript
// modules/metrics/services/calculator-registry.service.ts

@Injectable()
export class CalculatorRegistryService {
  private readonly _calculators = new Map<string, IMetricCalculator>();

  constructor(
    private readonly _speedCalculator: SpeakingSpeedCalculator,
    private readonly _pauseCalculator: PauseCalculator,
    private readonly _vocabCalculator: VocabularyCalculator,
    private readonly _fillerCalculator: FillerWordsCalculator,
    private readonly _confidenceCalculator: ConfidenceCalculator,
    private readonly _communicationCalculator: CommunicationCalculator,
    private readonly _finalScoreCalculator: FinalScoreCalculator,
  ) {
    this._register(this._speedCalculator);
    this._register(this._pauseCalculator);
    this._register(this._vocabCalculator);
    this._register(this._fillerCalculator);
    this._register(this._confidenceCalculator);
    this._register(this._communicationCalculator);
    this._register(this._finalScoreCalculator);
  }

  private _register(calculator: IMetricCalculator): void {
    this._calculators.set(calculator.metricName, calculator);
  }

  getCalculatorsInExecutionOrder(): IMetricCalculator[] {
    const list = [...this._calculators.values()];
    const resolved: IMetricCalculator[] = [];
    const visited = new Set<string>();

    const visit = (calc: IMetricCalculator) => {
      if (visited.has(calc.metricName)) return;
      
      for (const depName of calc.dependencies) {
        const dep = this._calculators.get(depName);
        if (!dep) throw new Error(`Missing dependency: ${depName} for ${calc.metricName}`);
        visit(dep);
      }
      
      visited.add(calc.metricName);
      resolved.push(calc);
    };

    list.forEach(visit);
    return resolved;
  }
}
```

---

## 4. Define Every Metric

Below is the architectural specification of the 11 core metrics.

| Metric | Purpose | Mathematical Formula | Inputs | Outputs | Complexity |
|---|---|---|---|---|---|
| **1. Speaking Speed** | Pacing & intelligibility | $WPM = \frac{N_{tokens}}{T_{sec}} \times 60$ | `normalizedTokens`, `durationSeconds` | `wpm: number` | $O(N)$ |
| **2. Average Pause** | Pausing flow control | $\mu_{pause} = \frac{\sum D_{pauses}}{N_{pauses}}$ | `pauseIntervals` | `avgPauseMs: number` | $O(P)$ |
| **3. Longest Pause** | Cognitive block detection | $Max_{pause} = \max(D_{pauses})$ | `pauseIntervals` | `longestPauseMs: number` | $O(P)$ |
| **4. Silent Time %** | Proportion of hesitation | $Silence\% = \frac{\sum D_{pauses}}{T_{sec} \times 1000} \times 100$ | `pauseIntervals`, `durationSeconds` | `silentTimePercent: number` | $O(P)$ |
| **5. Vocabulary Richness** | Lexical variety | $C = \frac{\log(V)}{\log(N)}$ (Herdan's C) | `normalizedTokens` | `richnessIndex: number` | $O(N)$ |
| **6. Repeated Words** | Fluency & repetition tracking | $Rep\% = \frac{N_{repeated}}{N_{total}} \times 100$ | `normalizedTokens`, `stopwords` | `repeatedRatio: number` | $O(N \cdot W)$ |
| **7. Filler Words** | Hesitation frequency | $Filler\% = \frac{N_{fillers}}{N_{total}} \times 100$ | `normalizedTokens`, `dictionary` | `fillerRatio: number` | $O(N)$ |
| **8. Sentence Length** | Syntactic structure | $SL_{avg} = \frac{N_{total\_words}}{N_{sentences}}$ | `rawTranscript` | `avgSentenceLength: number` | $O(N)$ |
| **9. Confidence Score** | Speech confidence index | $Conf = \sum (w_i \times S_{metric\_i})$ | Calculated metrics | `confidenceScore: number` | $O(1)$ |
| **10. Communication Score**| Combined delivery index | $Comm = \sum (w_j \times S_{metric\_j})$ | Calculated metrics | `communicationScore: number` | $O(1)$ |
| **11. Final Score** | Overall evaluation index | $Final = w_t \cdot S_{tech} + w_c \cdot S_{comm} + w_d \cdot S_{conf}$ | Calculated metrics, `technicalScore` | `finalScore: number` | $O(1)$ |

*Note on notation:*
*   $N$ or $N_{tokens}$ is the total word token count.
*   $V$ is the number of unique word types (vocabulary size).
*   $P$ is the total count of pause intervals.
*   $W$ is the sliding window size for repetitions.

---

## 5. Speaking Speed

### 5.1 Calculation Specification

Speaking speed is calculated as Words Per Minute (WPM):

$$WPM = \frac{\text{Word Count}}{\text{Duration in Seconds}} \times 60$$

### 5.2 Performance-Adjusted Score Mapping

The raw WPM is mapped to a 0–100 score using a localized Gaussian curve to penalize both extreme slowness and extreme speed:

$$Score_{WPM} = 100 \times e^{-\frac{(WPM - \mu_{target})^2}{2\sigma^2}}$$

Where:
*   $\mu_{target} = 130$ WPM (ideal speaking speed)
*   $\sigma = 35$ (spread adjustment factor)

```
Score
100 ┼          ╭───╮
    │        ╭─╯   ╰─╮
 80 ┼       ╭╯       ╰╮
    │      ╭╯         ╰╮
 50 ┼     ╭╯           ╰╮
    │    ╭╯             ╰╮
  0 ┼────┴──────┬──────┬─┴────
    0          130    200    WPM
```

### 5.3 Architectural Thresholds

| Classification | Range (WPM) | Score | Architectural Meaning |
|---|---|---|---|
| **Excellent** | $110 - 150$ | $90 - 100$ | Pacing supports listener comprehension. |
| **Good** | $95 - 109$ or $151 - 165$ | $70 - 89$ | Professional, minor variation. |
| **Average** | $80 - 94$ or $166 - 180$ | $50 - 69$ | Slightly slow/rushed, but understandable. |
| **Poor** | $60 - 79$ or $181 - 200$ | $20 - 49$ | Affects comprehension; communication is slow or rushed. |
| **Very Poor** | $< 60$ or $> 200$ | $0 - 19$ | Unacceptable. Indicates stuttering/blocking or excessive speed. |

### 5.4 Edge Cases
*   **Zero words / short answers ($T_{sec} < 5$):** If the user says nothing or only a single word (e.g. "yes"), $WPM$ can return infinity or an implausible number.
    *   *Architectural handling:* If $N_{tokens} < 5$ or $T_{sec} < 3$, return $WPM = 0$ and $Score_{WPM} = 0$.

---

## 6. Pause Analysis

Pauses are defined as silent intervals in the audio input where amplitude falls below threshold settings for a duration exceeding $200$ms.

### 6.1 Cognitive Basis for Thresholds
*   **$200\text{ms} - 500\text{ms}$ (Grammatical Pause):** Normal pause for breathing or punctuation.
*   **$500\text{ms} - 1500\text{ms}$ (Cognitive Planning Pause):** Normal structuring of complex technical thoughts.
*   **$> 1500\text{ms}$ (Hesitation Pause):** Long silence, interpreted as hesitation or cognitive block.

```
Timeline: [Speech] ────► [ grammatical ] ────► [ cognitive ] ────► [ hesitation ]
Duration:                200ms               500ms                1500ms
```

### 6.2 Pause Metrics Formulas

#### Average Pause Duration ($\mu_{pause}$):
$$\mu_{pause} = \frac{\sum_{i=1}^{N_{pauses}} D_i}{N_{pauses}}$$

#### Longest Pause ($Max_{pause}$):
$$Max_{pause} = \max(D_1, D_2, ..., D_n)$$

#### Silent Time Percentage ($Silence\%$):
$$Silence\% = \frac{\sum_{i=1}^{N_{pauses}} D_i}{Duration_{seconds} \times 1000} \times 100$$

#### Pause Frequency ($Freq_{pause}$):
$$Freq_{pause} = \frac{N_{pauses}}{Duration_{seconds}} \times 60$$

### 6.3 Edge Cases
*   **Continuous speaking:** $N_{pauses} = 0$.
    *   *Architectural handling:* Set $\mu_{pause} = 0$, $Max_{pause} = 0$, and $Silence\% = 0$. This configuration is penalized in the Confidence Score to account for rushed speech.

---

## 7. Vocabulary Analysis

### 7.1 Lexical Diversity Indices

#### Type-Token Ratio (TTR):
$$TTR = \frac{V}{N}$$

Where $V$ is the count of unique words, and $N$ is the total token count.
*   *Weakness:* Highly sensitive to text length (longer answers inherently have a lower TTR because speakers reuse common structural words like "the", "is", "to").

#### Herdan's C Index (Architectural Default):
$$C = \frac{\log(V)}{\log(N)}$$

*   *Strength:* Corrects for document length variation. Stable for answers ranging from 20 to 1000 words.

### 7.2 Repetitions Computation

#### Word Repetitions:
Computes the proportion of non-stopword tokens that are repeated within a sliding window of $W = 15$ words. This detects immediate stuttering and word loops.

$$RepRatio = \frac{Count(Repeated\_NonStopwords)}{N_{tokens}}$$

#### Phrase Repetitions ($N$-Grams):
Scans for duplicate bi-grams ($N=2$) and tri-grams ($N=3$) within the transcript (e.g. "and then", "what I mean is").

```
Input: "I need to configure configure the server and then configure the server"
Bi-gram detected: ["configure", "the"] repeated, ["the", "server"] repeated.
Tri-gram detected: ["configure", "the", "server"] repeated.
```

---

## 8. Filler Words Dictionary Architecture

To support clean multi-language deployments, the Metrics Engine separates the detection algorithm from language-specific datasets using a `DictionaryManagerService`.

### 8.1 Unified Dictionary Schema

All language dictionaries follow a strict JSON schema:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "LanguageDictionary",
  "type": "OBJECT",
  "required": ["languageCode", "fillers", "stopwords"],
  "properties": {
    "languageCode": { "type": "STRING", "pattern": "^[a-z]{2}(-[A-Z]{2})?$" },
    "fillers": {
      "type": "ARRAY",
      "items": {
        "type": "OBJECT",
        "required": ["pattern", "matchType", "replacement"],
        "properties": {
          "pattern": { "type": "STRING" },
          "matchType": { "type": "STRING", "enum": ["EXACT", "PHRASE", "REGEX"] },
          "replacement": { "type": "STRING" }
        }
      }
    },
    "stopwords": {
      "type": "ARRAY",
      "items": { "type": "STRING" }
    }
  }
}
```

### 8.2 Architectural Dictionary Data Excerpts

#### English (`en.json`):
```json
{
  "languageCode": "en",
  "fillers": [
    { "pattern": "um", "matchType": "EXACT", "replacement": "" },
    { "pattern": "uh", "matchType": "EXACT", "replacement": "" },
    { "pattern": "you know", "matchType": "PHRASE", "replacement": "" },
    { "pattern": "like", "matchType": "EXACT", "replacement": "" },
    { "pattern": "actually", "matchType": "EXACT", "replacement": "" },
    { "pattern": "basically", "matchType": "EXACT", "replacement": "" }
  ],
  "stopwords": ["the", "a", "an", "is", "are", "was", "were", "to", "of", "and", "or"]
}
```

#### French (`fr.json`):
```json
{
  "languageCode": "fr",
  "fillers": [
    { "pattern": "euh", "matchType": "EXACT", "replacement": "" },
    { "pattern": "du coup", "matchType": "PHRASE", "replacement": "" },
    { "pattern": "en fait", "matchType": "PHRASE", "replacement": "" },
    { "pattern": "voilà", "matchType": "EXACT", "replacement": "" },
    { "pattern": "genre", "matchType": "EXACT", "replacement": "" }
  ],
  "stopwords": ["le", "la", "les", "un", "une", "est", "sont", "de", "des", "et", "ou"]
}
```

---

## 9. Confidence Score

The Confidence Score is a deterministic index indicating delivery stability. It is calculated by penalizing hesitation indicators (filler words, long pauses, and slow pacing).

### 9.1 Scoring Weights

```
Confidence Score Components:
┌────────────────────────────────────────────────────────┐
│  Speaking Speed (Gaussian)                      [30%]  │
├────────────────────────────────────────────────────────┤
│  Filler Ratio Penalization                      [30%]  │
├────────────────────────────────────────────────────────┤
│  Longest Pause Penalty                          [20%]  │
├────────────────────────────────────────────────────────┤
│  Silent Time Proportion                         [20%]  │
└────────────────────────────────────────────────────────┘
```

### 9.2 Formulation

$$Score_{Confidence} = w_1 \cdot S_{WPM} + w_2 \cdot P_{fillers} + w_3 \cdot P_{pause\_max} + w_4 \cdot P_{silence}$$

#### Weights Configuration:
*   $w_1 = 0.30$
*   $w_2 = 0.30$
*   $w_3 = 0.20$
*   $w_4 = 0.20$

#### Penalization Functions:

*   **Filler Word Penalty ($P_{fillers}$):**
    $$P_{fillers} = \max\left(0, 100 - (\text{Filler Ratio} \times 10)\right)$$
    *(A filler ratio of $10\%$ results in a $P_{fillers}$ score of $0$)*

*   **Longest Pause Penalty ($P_{pause\_max}$):**
    $$P_{pause\_max} = \max\left(0, 100 - \frac{Max_{pause} - 500}{50}\right)$$
    *(Pauses under $500$ms receive no penalty. A $3$-second pause yields a $50$ point penalty)*

*   **Silence Penalty ($P_{silence}$):**
    $$P_{silence} = \max\left(0, 100 - (Silence\% \times 2.5)\right)$$
    *(A silent time proportion exceeding $40\%$ reduces the silence sub-score to $0$)*

---

## 10. Communication Score

The Communication Score evaluates delivery clarity. It combines pacing stability with vocabulary control and syntactic structure.

### 10.1 Scoring Weights

```
Communication Score Components:
┌────────────────────────────────────────────────────────┐
│  Confidence Score Integration                   [40%]  │
├────────────────────────────────────────────────────────┤
│  Herdan's C Lexical Richness                    [30%]  │
├────────────────────────────────────────────────────────┤
│  Sentence Structure Penalty                     [15%]  │
├────────────────────────────────────────────────────────┤
│  Repetition Penalty                             [15%]  │
└────────────────────────────────────────────────────────┘
```

### 10.2 Formulation

$$Score_{Communication} = 0.40 \cdot Score_{Confidence} + 0.30 \cdot S_{vocab} + 0.15 \cdot S_{structure} + 0.15 \cdot S_{repetition}$$

#### Sub-Score Calculations:

*   **Vocabulary Score ($S_{vocab}$):**
    $$S_{vocab} = \max\left(0, \frac{HerdanC - 0.5}{0.4} \times 100\right)$$
    *(Herdan C index below $0.5$ defaults to $0$; indices $0.9$ and above map to $100$)*

*   **Syntactic Structure Score ($S_{structure}$):**
    Penalizes extreme average sentence lengths (too short/fragmented or too long/run-on):
    $$S_{structure} = 100 \times e^{-\frac{(SL_{avg} - 15)^2}{2(5)^2}}$$
    *(Optimal average sentence length is $15$ words)*

*   **Repetition Penalty ($S_{repetition}$):**
    $$S_{repetition} = \max(0, 100 - (RepRatio \times 10))$$

---

## 11. Technical Score

The Technical Score represents technical accuracy and semantic correctness. It is generated by the AI subsystem and consumed as a read-only input by the Metrics Engine.

```
┌────────────────────────────────────────────────────────┐
│                    AI Subsystem                        │
│   Evaluates: Semantic relevance, conceptual accuracy    │
│   Result: technicalScore (0-100)                       │
└──────────────────────────┬─────────────────────────────┘
                           │ writes to Mongoose
                           ▼
┌────────────────────────────────────────────────────────┐
│                 Mongoose DB Collection                 │
│                collection: ai_evaluations              │
└──────────────────────────┬─────────────────────────────┘
                           │ read by AnswerService
                           ▼
┌────────────────────────────────────────────────────────┐
│                 Metrics Engine Core                    │
│   Consumes: technicalScore                             │
│   Calculates: finalScore (weighted combination)        │
└────────────────────────────────────────────────────────┘
```

**Architectural Rule:** The Metrics Engine must never attempt to compute, approximate, or modify the Technical Score.

---

## 12. Final Interview Score

The Final Interview Score combines delivery quality (Communication), confidence, and accuracy (Technical) into a single overall performance metric.

### 12.1 Scoring Equation

$$Score_{Final} = w_{technical} \cdot Score_{Technical} + w_{communication} \cdot Score_{Communication} + w_{confidence} \cdot Score_{Confidence}$$

### 12.2 Configurable Evaluation Weights

The scoring weights adapt to the target interview track, configured in the `constants` database collection:

```json
{
  "tracks": {
    "TECHNICAL": {
      "w_technical": 0.60,
      "w_communication": 0.25,
      "w_confidence": 0.15
    },
    "HR": {
      "w_technical": 0.20,
      "w_communication": 0.50,
      "w_confidence": 0.30
    },
    "MIXED": {
      "w_technical": 0.40,
      "w_communication": 0.40,
      "w_confidence": 0.20
    }
  }
}
```

---

## 13. Configuration System

To remain compliant with the Open-Closed Principle (OCP), the Metrics Engine uses a database-driven registry config pattern. Adding a new metric calculator does not require modification to the scoring aggregator code.

```
┌────────────────────────────────────────────────────────┐
│                 Mongoose Database                      │
│                 collection: constants                  │
└──────────────────────────┬─────────────────────────────┘
                           │ loads thresholds JSON
                           ▼
┌────────────────────────────────────────────────────────┐
│                 MetricsConfigService                   │
│   Caches configuration parameters in-memory (TTL)      │
└──────────────────────────┬─────────────────────────────┘
                           │ injects sub-configs
                           ▼
┌────────────────────────────────────────────────────────┐
│                  IMetricCalculator                     │
│   Reads: thresholds, weights, and active parameters    │
└────────────────────────────────────────────────────────┘
```

### Database Configuration Document Schema (`constants` collection entry)

```json
{
  "_id": "ObjectId",
  "name": "metrics_engine_configuration",
  "version": "1.0",
  "thresholds": {
    "wpm": { "ideal": 130, "variance": 35 },
    "pause": { "grammaticalMs": 200, "cognitiveMs": 500, "hesitationMs": 1500 },
    "vocabulary": { "minHerdanC": 0.5, "idealHerdanC": 0.9 },
    "sentenceLength": { "ideal": 15, "variance": 5 }
  },
  "scoreWeights": {
    "confidence": { "wpm": 0.30, "fillers": 0.30, "longestPause": 0.20, "silence": 0.20 },
    "communication": { "confidence": 0.40, "richness": 0.30, "structure": 0.15, "repetition": 0.15 }
  },
  "updatedAt": "Date"
}
```

---

## 14. Reporting Schema

This is the JSON schema returned by the Metrics Engine upon interview completion:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "MetricsReport",
  "type": "OBJECT",
  "required": ["rawMetrics", "scores", "insights", "warnings"],
  "properties": {
    "rawMetrics": {
      "type": "OBJECT",
      "required": ["wordsPerMinute", "avgPauseMs", "longestPauseMs", "silentTimePercent", "fillerWordCount", "vocabularyRichness"],
      "properties": {
        "wordsPerMinute": { "type": "INTEGER" },
        "avgPauseMs": { "type": "INTEGER" },
        "longestPauseMs": { "type": "INTEGER" },
        "silentTimePercent": { "type": "NUMBER" },
        "fillerWordCount": { "type": "INTEGER" },
        "vocabularyRichness": { "type": "NUMBER" },
        "avgSentenceLength": { "type": "NUMBER" }
      }
    },
    "scores": {
      "type": "OBJECT",
      "required": ["confidence", "communication", "technical", "final"],
      "properties": {
        "confidence": { "type": "INTEGER", "minimum": 0, "maximum": 100 },
        "communication": { "type": "INTEGER", "minimum": 0, "maximum": 100 },
        "technical": { "type": "INTEGER", "minimum": 0, "maximum": 100 },
        "final": { "type": "INTEGER", "minimum": 0, "maximum": 100 }
      }
    },
    "insights": {
      "type": "OBJECT",
      "required": ["strengths", "weaknesses", "recommendations"],
      "properties": {
        "strengths": { "type": "ARRAY", "items": { "type": "STRING" } },
        "weaknesses": { "type": "ARRAY", "items": { "type": "STRING" } },
        "recommendations": { "type": "ARRAY", "items": { "type": "STRING" } }
      }
    },
    "warnings": {
      "type": "ARRAY",
      "items": {
        "type": "OBJECT",
        "required": ["code", "message", "severity"],
        "properties": {
          "code": { "type": "STRING" },
          "message": { "type": "STRING" },
          "severity": { "type": "STRING", "enum": ["WARNING", "CRITICAL"] }
        }
      }
    }
  }
}
```

---

## 15. Historical Progress Engine

To support progress tracking over time, the system aggregates metric trends across past sessions.

### 15.1 MongoDB Trend Aggregation Pipeline

```javascript
db.interviews.aggregate([
  // 1. Filter completed interviews for a specific user
  { $match: { userId: ObjectId("user_id_here"), status: "Completed" } },
  
  // 2. Sort by completion date to establish timeline order
  { $sort: { endedAt: 1 } },
  
  // 3. Join with answer collection
  {
    $lookup: {
      from: "answers",
      localField: "_id",
      foreignField: "interviewId",
      as: "sessionAnswers"
    }
  },
  
  // 4. Flatten the answers array
  { $unwind: "$sessionAnswers" },
  
  // 5. Join with interview_metrics collection
  {
    $lookup: {
      from: "interview_metrics",
      localField: "sessionAnswers._id",
      foreignField: "answerId",
      as: "metrics"
    }
  },
  
  { $unwind: "$metrics" },
  
  // 6. Group by interview session to compute session-level averages
  {
    $group: {
      _id: "$_id",
      endedAt: { $first: "$endedAt" },
      mode: { $first: "$mode" },
      avgWpm: { $avg: "$metrics.wordsPerMinute" },
      avgPause: { $avg: "$metrics.averagePauseMs" },
      totalFillers: { $sum: "$metrics.fillerWordCount" },
      avgRichness: { $avg: "$metrics.vocabularyRichness" },
      sessionCommScore: { $first: "$communicationScore" },
      sessionTechScore: { $first: "$technicalScore" },
      sessionConfScore: { $first: "$confidenceScore" },
      sessionOverallScore: { $first: "$overallScore" }
    }
  },
  
  // 7. Group all sessions together to compute aggregate trend lines and averages
  {
    $group: {
      _id: null,
      history: {
        $push: {
          interviewId: "$_id",
          date: "$endedAt",
          overallScore: "$sessionOverallScore",
          commScore: "$sessionCommScore",
          techScore: "$sessionTechScore",
          wpm: "$avgWpm"
        }
      },
      historicalAverages: {
        $first: {
          wpm: { $avg: "$avgWpm" },
          pauseMs: { $avg: "$avgPause" },
          richness: { $avg: "$avgRichness" },
          overallScore: { $avg: "$sessionOverallScore" }
        }
      }
    }
  }
]);
```

### 15.2 Database Storage Design

Aggregated historical statistics are indexed under the `historical_aggregates` collection. This collection is updated asynchronously via background jobs upon session completion, keeping dashboard load times fast.

```
Collection: historical_aggregates
Indexes: 
  - userId: 1 (UNIQUE)
  - updatedAt: -1
```

---

## 16. Frontend Integration

### 16.1 Angular Services and Signal Integration

```typescript
// core/metrics/services/metrics.service.ts

@Injectable({ providedIn: 'root' })
export class MetricsService {
  private readonly _activeReport = signal<ICommunicationReport | null>(null);
  private readonly _history = signal<IHistoricalAggregate | null>(null);
  private readonly _loading = signal<boolean>(false);

  readonly activeReport = this._activeReport.asReadonly();
  readonly history = this._history.asReadonly();
  readonly loading = this._loading.asReadonly();

  constructor(private readonly _http: HttpClient) {}

  /**
   * Load the metrics report for a completed interview.
   */
  async loadReport(interviewId: string): Promise<void> {
    this._loading.set(true);
    try {
      const response = await firstValueFrom(
        this._http.get<ApiResponse<ICommunicationReport>>(`/interviews/${interviewId}/metrics`)
      );
      this._activeReport.set(response.data);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Retrieve historical aggregates for dashboard charting.
   */
  async loadHistoricalData(): Promise<void> {
    this._loading.set(true);
    try {
      const response = await firstValueFrom(
        this._http.get<ApiResponse<IHistoricalAggregate>>('/analytics/historical-metrics')
      );
      this._history.set(response.data);
    } finally {
      this._loading.set(false);
    }
  }
}
```

### 16.2 UI Dashboard Composition

```
┌────────────────────────────────────────────────────────┐
│                  DASHBOARD HOME VIEW                   │
│                                                        │
│  ┌───────────────────────┐   ┌──────────────────────┐  │
│  │    Overall Score      │   │    Speaking Pacing   │  │
│  │       [ 84 ]          │   │      130 WPM         │  │
│  │    (Comm:82, Tech:85) │   │     (Excellent)      │  │
│  └───────────────────────┘   └──────────────────────┘  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │               Performance Trend                  │  │
│  │  Line Chart: Overall Score over last 10 sessions │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ┌───────────────────────┐   ┌──────────────────────┐  │
│  │   Radar Metrics View  │   │  Historical Averages │  │
│  │  Fluency · Vocabulary │   │  WPM: 124  Fillers: 3│  │
│  │  Confidence · Pause   │   │  Pause Time: 420ms   │  │
│  └───────────────────────┘   └──────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## 17. Backend Integration

### 17.1 NestJS Module Setup

```typescript
// modules/metrics/metrics.module.ts

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InterviewMetrics.name, schema: InterviewMetricsSchema },
    ]),
    ConfigModule,
  ],
  controllers: [MetricsController],
  providers: [
    MetricsEngineService,
    CalculatorRegistryService,
    MetricsConfigService,
    DictionaryManagerService,
    MetricsRepository,
    // Calculators
    SpeakingSpeedCalculator,
    PauseCalculator,
    VocabularyCalculator,
    FillerWordsCalculator,
    ConfidenceCalculator,
    CommunicationCalculator,
    FinalScoreCalculator,
  ],
  exports: [MetricsEngineService, MetricsConfigService],
})
export class MetricsModule {}
```

### 17.2 Caching Strategy

Historical aggregations are resource-intensive because they traverse multiple collections. The system caches these results using NestJS's in-memory `CacheModule`:

*   **Cache Key format:** `user:analytics:{userId}`
*   **Time-To-Live (TTL):** $1\text{ hour } (3600\text{ seconds})$
*   **Invalidation Pattern:** Any write operation to the `interviews` collection (e.g. completing a new session) invalidates the cache key for that user.

---

## 18. Testing Strategy

The decoupled design makes testing straightforward.

```
┌────────────────────────────────────────┐
│               Unit Tests               │
├────────────────────────────────────────┤
│ - Isolated tests for each calculator   │
│ - Mock transcripts + mock audio timings│
│ - Zero network or database dependencies│
└───────────────────┬────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────┐
│            Integration Tests           │
├────────────────────────────────────────┤
│ - Test pipeline run via facade service │
│ - Confirm correct execution ordering   │
│ - Validate output against JSON schema  │
└────────────────────────────────────────┘
```

### 18.1 Unit Testing Calculators

Since each calculator has a single responsibility, they can be tested using mock contexts.

```typescript
// modules/metrics/calculators/speaking-speed.calculator.spec.ts

describe('SpeakingSpeedCalculator', () => {
  let calculator: SpeakingSpeedCalculator;

  beforeEach(() => {
    calculator = new SpeakingSpeedCalculator();
  });

  it('should compute correct WPM for normal inputs', async () => {
    const context = createMockContext({
      normalizedTokens: ['one', 'two', 'three', 'four', 'five'],
      durationSeconds: 2.5
    });

    const result = await calculator.calculate(context);
    expect(result.wpm).toBe(120); // (5 / 2.5) * 60 = 120 WPM
  });

  it('should handle zero duration gracefully', async () => {
    const context = createMockContext({
      normalizedTokens: ['one'],
      durationSeconds: 0
    });

    const result = await calculator.calculate(context);
    expect(result.wpm).toBe(0);
  });
});
```

---

## 19. Design Patterns Used

The Metrics Engine uses classic software design patterns to keep the implementation maintainable.

### 19.1 Strategy Pattern
*   **Implementation:** Calculators implement `IMetricCalculator`.
*   **Why Chosen:** Enables selection and execution of different metrics calculations at runtime without using hardcoded conditional branches.

### 19.2 Pipeline Pattern
*   **Implementation:** The sequential execution flow: normalization ➔ tokenization ➔ calculation ➔ aggregation.
*   **Why Chosen:** Ensures a predictable flow of transcript transformation. New preprocessing steps (e.g., text spell-correction) can be added as a step in the pipeline.

### 19.3 Registry Pattern
*   **Implementation:** `CalculatorRegistryService` tracks active calculators.
*   **Why Chosen:** Decouples the execution manager from the concrete classes, satisfying the Open-Closed Principle (OCP).

### 19.4 Builder Pattern
*   **Implementation:** The report construction sequence in the pipeline facade.
*   **Why Chosen:** Handles the construction of the complex `ICommunicationReport` object step-by-step.

---

## 20. Architecture Rules

The following rules govern the Metrics Engine codebase:

*   **Rule MET-1: No AI Dependencies.** The Metrics Engine and its calculators must never perform HTTP calls or import dependencies related to Gemini, OpenAI, Claude, or any external AI SDK.
*   **Rule MET-2: Strict Determinism.** All calculator classes must produce the exact same output when given the same `IPipelineContext` input. Calculators must not use random seeds, current system timestamps, or third-party stateful services.
*   **Rule MET-3: Dependency-Free Calculations.** No calculator should access the database. If configuration thresholds are required, they must be retrieved from the `IPipelineContext` or injected via `MetricsConfigService` during instantiation.
*   **Rule MET-4: Unidirectional Flow.** Pipeline steps must never modify the output of previous steps. They can only append new keys to the `calculatedMetrics` map.
*   **Rule MET-5: Safe Runtime Fallbacks.** If a calculator fails due to malformed input data, it must catch the error, log it, and default its value to $0$ rather than crashing the pipeline.
