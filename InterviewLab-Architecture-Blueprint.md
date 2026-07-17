# InterviewLab — Complete Software Architecture Blueprint v1.0

> **Status**: Official Architecture Blueprint  
> **Audience**: Engineering team building InterviewLab from scratch  
> **Stack**: Angular 18+ · NestJS 10 · Fastify · MongoDB · Mongoose · Gemini API · Docker  
> **Prepared by**: Principal Software Architect

---

## Table of Contents

1. [Global Architecture Philosophy](#1-global-architecture-philosophy)
2. [Architectural Decisions: Replacing Company-Specific Abstractions](#2-architectural-decisions-replacing-company-specific-abstractions)
3. [Backend Architecture](#3-backend-architecture)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Database Design](#5-database-design)
6. [AI Architecture](#6-ai-architecture)
7. [Speech Architecture](#7-speech-architecture)
8. [Metrics Engine](#8-metrics-engine)
9. [Authentication Flow](#9-authentication-flow)
10. [Complete Folder Trees](#10-complete-folder-trees)
11. [Data Flow Diagrams](#11-data-flow-diagrams)
12. [State Management Strategy](#12-state-management-strategy)
13. [Module Communication Rules](#13-module-communication-rules)
14. [Design Patterns Used](#14-design-patterns-used)
15. [Architecture Rules](#15-architecture-rules)
16. [Naming Conventions](#16-naming-conventions)
17. [Dependency Diagrams](#17-dependency-diagrams)

---

## 1. Global Architecture Philosophy

### 1.1 Architectural Style: Pragmatic Modular Monolith

InterviewLab is built as a **Modular Monolith with Clean Architecture principles**. This is the same architectural style used in the source review, and it is the correct choice for this phase of the product.

**Why a Modular Monolith and not Microservices?**

- InterviewLab is a new product. Microservices add enormous operational complexity (distributed tracing, service discovery, network failures, data consistency across services) that is premature when the domain boundaries are not yet fully understood.
- The interview domain is tightly coupled by nature: a session must know about the user, the profile, the questions, the answers, and the metrics simultaneously. Splitting these into microservices would require extensive inter-service communication.
- A well-designed modular monolith can be decomposed into microservices later, if and when scale demands it. The module boundaries established here are designed to support that future migration without a full rewrite.
- The team can ship faster, test more easily, and reason about the system holistically.

**Why not a flat monolith?**

- A flat monolith with no module boundaries becomes unmaintainable as domains grow. Business logic bleeds across concerns. The interview module starts importing user internals. The metrics engine couples to the AI engine.
- InterviewLab has clearly distinct aggregates: Users, Profiles, Sessions, Questions, Answers, Metrics, Notifications. Each aggregate must own its data and expose it only through defined interfaces.

**Borrowed from Clean Architecture:**
- The domain (entities, interfaces) does not depend on infrastructure (HTTP, MongoDB, Gemini SDK).
- The AI provider is behind an interface. The rest of the system never imports the Gemini SDK directly.

**Borrowed from Hexagonal Architecture:**
- The `Repository` (called DAO in the source) acts as a Port. The Mongoose implementation is the Adapter.
- The `AIProvider` interface is a Port. `GeminiProvider` is the Adapter. Another provider can be plugged in without changing any business code.

**Borrowed from DDD Lite:**
- Each domain module owns its aggregate: schema, DAO, service, controller, errors, enums.
- Cross-module communication goes through exported services, never through direct model or DAO access.

---

### 1.2 Core Principles Preserved from Source Architecture

| Principle | How It Is Applied in InterviewLab |
|---|---|
| SOLID | Each service has one responsibility; interfaces are small and focused; dependency inversion via repository and AI provider patterns |
| Separation of Concerns | Controller → Service → Repository → Schema; AI separated from Metrics; Speech separated from both |
| Dependency Injection | NestJS DI container manages the entire object graph; Angular DI handles the frontend |
| Feature-based Architecture | Each feature is a self-contained module on both backend and frontend |
| Modular Design | Backend: NestJS modules. Frontend: Angular standalone components grouped by feature |
| Clean Boundaries | No module accesses another module's internals; cross-cutting concerns live in `core/` |
| Testability | Repository pattern enables mocking; AI provider interface enables test doubles; pure utility functions are trivially testable |

---

## 2. Architectural Decisions: Replacing Company-Specific Abstractions

This section documents every company-specific element from the source architecture, explains why it existed, and describes the replacement decision.

### 2.1 `@keenops/ng` (Enterprise SDK — Tier 1 Library)

**Why it existed:**  
The `@keenops/ng` SDK provided authorization routines (JWT storage, route guards), a notification provider, abstract state containers (`AsyncStore<TState>`, `ListStore<T>`), and a base HTTP service. It existed because the company had multiple Angular applications that needed to share this infrastructure without duplicating it.

**Decision: D — InterviewLab implements its own equivalents, entirely within the application.**

**Why:**
- InterviewLab has only one frontend application. There is no need for a published npm package that multiple apps consume.
- The `@keenops/ng` abstractions were tightly coupled to KeenOps-specific authentication flow (role types, token storage conventions). These assumptions do not apply to InterviewLab.
- Angular 18+ already provides the foundation: `HttpClient` with functional interceptors, signals for state, and functional guards.
- Putting these abstractions inside the app's `core/` folder keeps them visible, modifiable, and testable by the team without managing an external package.

**Replacements:**
| `@keenops/ng` feature | InterviewLab replacement |
|---|---|
| Authorization routines | `AuthService` + `AuthStore` (signal-based) inside `core/auth/` |
| JWT storage | `TokenService` (wraps `localStorage` with a clean interface) in `core/auth/` |
| Abstract state containers (`AsyncStore<T>`) | `BaseStore<TState>` implemented in `core/store/` — same design, no external dependency |
| List state container (`ListStore<T>`) | `ListStore<T>` in `core/store/` |
| Notification provider | `NotificationService` using Angular Material Snackbar — standard, zero coupling |
| Base HTTP service | Angular's `HttpClient` directly, configured via interceptors |

---

### 2.2 `local-keenops` (Workspace Core Library — Tier 2)

**Why it existed:**  
`local-keenops` was a local Angular library project (built with `ng-packagr`) that isolated reusable UI behaviors: `AbstractTableWidget<T>`, `AbstractForm<T>`, `AbstractModalForm<T>`, `AbstractSelectWidget<T>`, `BaseCrudAPI`, `BaseDataService<T>`. It was a library because other workspace projects might reference it.

**Decision: D — InterviewLab implements equivalent abstractions directly inside `core/` and `shared/` within the single application project.**

**Why:**
- Building a separate library with `ng-packagr` adds real development overhead: watch builds must be running, build artifacts must be rebuilt after changes, and the feedback loop is slower. This overhead is only justified when the library is shared across multiple projects.
- InterviewLab is a single project. The abstractions belong in `src/app/core/` where they are immediately available without a build step.
- The abstract base classes survive the migration because they solve a real problem: they reduce boilerplate in components that share a pattern (tables, forms, dialogs). The delivery mechanism changes, not the concept.

**Replacements:**
| `local-keenops` feature | InterviewLab replacement |
|---|---|
| `BaseCrudAPI<T>` | `BaseApiService<T>` in `core/http/` |
| `BaseDataService<T>` (cache + dedup) | `BaseResourceService<T>` in `core/services/` — same TTL cache and deduplication logic |
| `ListStore<T>` | `ListStore<T>` in `core/store/` |
| `AbstractTableWidget<T>` | `BaseTableComponent<T>` in `shared/components/table/` |
| `AbstractForm<T>` | `BaseFormComponent<T>` in `shared/components/form/` |
| `AbstractSelectWidget<T>` | `BaseSelectComponent<T>` in `shared/components/select/` |

---

### 2.3 `authUrlRewriteInterceptor` (Company-Specific Interceptor)

**Why it existed:**  
The `@keenops/ng/auth` SDK assumed authentication endpoints at `/auth/signin`, `/auth/signup`. The backend exposed `/for-admin/auth/sign-in`. The interceptor was a workaround to avoid modifying the SDK.

**Decision: A — Angular already provides the correct solution.**

**Why:**  
Since InterviewLab has no SDK dependency with hardcoded URL assumptions, there is no URL mismatch to work around. InterviewLab's `AuthApiService` directly calls `/auth/sign-in` with the correct paths. The interceptor pattern is still used — but for legitimate purposes: attaching the JWT Bearer token (`AuthInterceptor`) and handling 401 responses (`TokenRefreshInterceptor`).

**Replacement:** No rewrite interceptor. Clean API service with correct paths. Standard `AuthInterceptor` for token injection.

---

### 2.4 `yfa-*` Component Selectors and KeenOps Naming

**Why it existed:**  
`yfa-` was the Yalla-Farha Admin prefix. KeenOps naming conventions permeated classes, decorators, and file naming.

**Decision: Apply clean, product-aligned naming.**

**Replacement:**  
- Component selectors: `il-*` (InterviewLab prefix). Example: `il-session-card`, `il-waveform`, `il-metrics-panel`.
- No class names referencing KeenOps, Yalla-Farha, or admin-specific concepts.
- All naming conventions described in Section 16.

---

### 2.5 `SlackNotificationService` / `ClickUpChatService` (Company-Specific Alerting)

**Why they existed:**  
The source architecture routes 5xx errors to Slack and ClickUp for developer alerting.

**Decision: D — Replace with a generic `AlertingService` interface pattern.**

**Why:**  
Rather than hardcoding Slack and ClickUp as the alerting targets, InterviewLab should define an `IAlertingService` interface with a single method: `sendAlert(event: AlertEvent): Promise<void>`. The concrete implementation can be `ConsoleAlertingService` in development and a webhook-based implementation in production. This is swappable without modifying `GlobalExceptionFilter`.

**Replacement:**
```typescript
// core/alerting/alerting.interface.ts
export interface IAlertingService {
  sendAlert(event: AlertEvent): Promise<void>;
}

// core/alerting/console-alerting.service.ts (dev)
// core/alerting/webhook-alerting.service.ts (prod)
```

---

### 2.6 `PrimeNG` Component Library

**Why it existed:**  
PrimeNG is an Angular component library. The source used it extensively with a custom Aura theme.

**Decision: C — Replace with Angular Material.**

**Why:**
- The specified technology stack for InterviewLab explicitly lists **Angular Material**.
- Angular Material is the official Angular component library maintained by the Angular team. It has native support for Angular signals, better tree-shaking, and zero configuration for accessibility.
- TailwindCSS handles layout and custom styling. Angular Material handles form controls, dialogs, snackbars, chips, and navigation.
- This eliminates the PrimeNG CSS layering complexity (`cssLayer` configuration in `app.config.ts`) because Angular Material and TailwindCSS co-exist cleanly using Angular Material's theming system.

---

### 2.7 `BaseDAO` → `BaseRepository`

**Why it existed:**  
`BaseDAO<T>` provided generic MongoDB operations: `findAll`, `findById`, `create`, `update`, `deleteById`, `hardDelete`, soft-delete filter, pagination, population.

**Decision: D — Preserve the pattern, rename to align with standard terminology.**

**Why:**  
The Repository pattern is correct. The DAO naming is more of a Java convention. In the NestJS/Node.js ecosystem, "Repository" is the standard term (used by TypeORM, MikroORM). Renaming to `BaseRepository<T>` improves readability for engineers joining the team without changing behavior.

**Replacement:** `BaseRepository<T>` in `core/repository/`. Same capabilities: soft-delete, pagination, population. InterviewLab does NOT need hard delete for user-facing data.

---

### 2.8 `BaseCrudService` → `BaseResourceService`

**Why it existed:**  
`BaseCrudService<T>` provided CRUD operations with pre/post processor hooks (Template Method pattern).

**Decision: D — Preserve with a cleaner interface.**

**Why:**  
The pre/post processor pattern is valuable — it allows domain-specific side effects (e.g., sending a notification after creating a session) without subclassing or modifying the base. The naming `BaseCrudService` implies it is only for CRUD, which is limiting. `BaseResourceService<T>` better communicates that it manages a resource lifecycle.

---

### 2.9 Redis (Rate Limiting)

**Why it existed:**  
Redis was used exclusively for rate limiting with an in-memory fallback.

**Decision: D — Omit Redis in v1.0. Use in-memory rate limiting only.**

**Why:**  
InterviewLab v1.0 will run as a single Docker container. Redis adds operational complexity (a second container, connection management, failure handling). Rate limiting with in-memory storage is sufficient for a single process. The `RateLimitService` is designed with a `IRateLimitStore` interface so Redis can be added later without changing any consumer.

---

### 2.10 Stripe, Firebase FCM, SendGrid, Google OAuth

**Why they existed:**  
These were KeenOps-specific integrations for payment, push notifications, email, and social authentication.

**Decision: Remove entirely from InterviewLab v1.0.**

**Why:**  
InterviewLab's domains do not include payment, mobile push notifications via FCM, or social auth in v1.0. If needed in the future, they are added as separate modules behind provider interfaces (same pattern as AI module).

---

## 3. Backend Architecture

### 3.1 Global Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENTS (Angular SPA)                           │
└────────────────────────────┬────────────────────────────────────────────┘
                             │ HTTP/JSON (Fastify)
┌────────────────────────────▼────────────────────────────────────────────┐
│                         GLOBAL LAYER                                    │
│  LoggingInterceptor · GlobalExceptionFilter · ValidationPipe            │
│  RequestIdInterceptor · ResponseWrapperInterceptor                      │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────────┐
│                     CORE MODULE (@Global)                               │
│                                                                         │
│  Guards: JwtAuthGuard · RateLimitGuard · OwnershipGuard                 │
│  Decorators: @CurrentUser() · @CurrentSession() · @CheckAuth()          │
│  Repository: BaseRepository<T> · QueryService                           │
│  Services: BaseResourceService<T> · RateLimitService · AlertingService  │
│  Pipes: QueryParserPipe · ValidationPipe                                │
│  Exceptions: AppException · CORE_ERRORS · GlobalExceptionFilter         │
│  Utils: date · string · mongo · validation (pure functions)             │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────────┐
│                    BUSINESS DOMAIN MODULES                              │
│                                                                         │
│  auth · users · candidate-profile · cv · interview · question           │
│  answer · metrics · speech · ai · notification · settings               │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────────┐
│                      PERSISTENCE LAYER                                  │
│  MongoDB (Mongoose) — Collections described in Section 5                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 3.2 Module Inventory

| Module | Responsibilities | Key Dependencies |
|---|---|---|
| `auth` | Registration, login, logout, JWT issuance, session management, token refresh, password reset | `users` |
| `users` | User CRUD, profile linking | `auth` (exported schemas) |
| `candidate-profile` | CV-derived profile: skills, experience, summary, strengths, weaknesses | `users`, `cv`, `ai` |
| `cv` | CV file upload, storage, metadata. Triggers AI analysis on upload | `candidate-profile`, `ai`, `storage` |
| `interview` | Interview session lifecycle: create, start, complete, cancel. Orchestrates question generation | `users`, `candidate-profile`, `question`, `ai` |
| `question` | Question entity: generated by AI for a session, typed (HR/Technical) | `interview`, `ai` |
| `answer` | Answer entity: transcript, audio URL, duration. One per question | `question`, `interview`, `speech`, `metrics` |
| `speech` | Speech processing: transcript validation, audio recording coordination. Pure coordinator | `answer` |
| `metrics` | Deterministic metrics computation per answer | `answer` |
| `ai` | AI provider abstraction: CV analysis, question generation, answer evaluation | *(no domain module deps; injected into others)* |
| `storage` | File storage abstraction (local/S3). File upload, URL generation | *(infrastructure)* |
| `notification` | In-app notification records, delivery | `users` |
| `settings` | Per-user application settings | `users` |

---

### 3.3 Module Internal Structure

Every business domain module follows this exact internal structure:

```
modules/{name}/
├── {name}.module.ts           ← Module definition
├── {name}.errors.ts           ← Domain error constants
├── {name}.enums.ts            ← Domain enumerations (if any)
├── controllers/
│   └── {name}.controller.ts   ← HTTP routes
├── repositories/
│   └── {name}.repository.ts   ← Extends BaseRepository<T>
├── schemas/
│   └── {name}.schema.ts       ← Mongoose schema + model
├── services/
│   └── {name}.service.ts      ← Business logic
├── dtos/
│   ├── create-{name}.dto.ts   ← Request body validation
│   └── update-{name}.dto.ts
├── interfaces/
│   └── {name}.interface.ts    ← TypeScript interfaces for this domain
└── projections/
    └── {name}.projection.ts   ← Field selection policies
```

**Why this structure:**
- Every module is self-contained. A developer looking at the `interview` module sees everything it owns in one place.
- The `errors.ts` file co-located with the module means error codes are discoverable. You never hunt through `core/` for a module-specific error.
- `dtos/` co-located with the module means the validation contract lives next to the controller that uses it, not in a global folder that grows without bound.
- `projections/` enforce field-level security at the controller layer. A controller for a regular user cannot accidentally expose admin-only fields.

---

### 3.4 Controllers

**Rule: Controllers are thin. They only:**
1. Declare the route path and HTTP method.
2. Apply decorators (auth, rate limit, validation).
3. Call exactly one service method.
4. Return the result.

```typescript
// interview.controller.ts
@Controller('interviews')
export class InterviewController {
  constructor(private readonly _interviewService: InterviewService) {}

  @Post()
  @CheckAuth({ jwt: true })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateInterviewDto,
  ) {
    return this._interviewService.createSession(user.sub, dto);
  }

  @Get(':id/start')
  @CheckAuth({ jwt: true })
  async startSession(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this._interviewService.startSession(user.sub, id);
  }
}
```

**No business logic in controllers.** If the method body has branching logic or performs multiple service calls, it is a violation.

---

### 3.5 Services

Services contain all business workflow logic. They orchestrate repositories and other services.

```typescript
// interview.service.ts
@Injectable()
export class InterviewService {
  constructor(
    private readonly _interviewRepository: InterviewRepository,
    private readonly _questionService: QuestionService,
    private readonly _aiService: AIService,
    private readonly _profileService: CandidateProfileService,
  ) {}

  async createSession(userId: string, dto: CreateInterviewDto): Promise<Interview> {
    const profile = await this._profileService.findByUserId(userId);
    if (!profile) AppException.throw(INTERVIEW_ERRORS.NO_PROFILE);

    const session = await this._interviewRepository.create({
      userId,
      candidateProfileId: profile.id,
      mode: dto.mode,
      status: InterviewStatus.PENDING,
    });

    // Generate questions using AI, driven by profile summary
    const questions = await this._questionService.generateForSession(session.id, profile, dto.mode);
    return { ...session, questions };
  }
}
```

**Services never call `Model.find()` directly.** They go through repositories.

---

### 3.6 Repositories

The `BaseRepository<T>` in `core/repository/base.repository.ts` provides:

```typescript
export abstract class BaseRepository<T> {
  constructor(protected readonly _model: Model<T>) {}

  async findAll(config: QueryConfig<T>): Promise<PaginatedResult<T>>
  async findById(id: string, config?: QueryConfig<T>): Promise<T | null>
  async findOne(filter: FilterQuery<T>, config?: QueryConfig<T>): Promise<T | null>
  async create(data: Partial<T>): Promise<T>
  async updateById(id: string, data: Partial<T>): Promise<T | null>
  async softDeleteById(id: string): Promise<void>

  // Protected — all queries are pre-filtered to exclude soft-deleted records
  protected _buildBaseFilter(): FilterQuery<T>
}
```

**Why soft-delete is baked into `BaseRepository`:**  
If every developer must remember to add `{ deletedAt: { $exists: false } }` to every query, someone will forget. The base repository makes forgetting impossible. Opt-in for including deleted records is explicit and intentional.

**Module-level repositories extend it:**
```typescript
// interview.repository.ts
@Injectable()
export class InterviewRepository extends BaseRepository<Interview> {
  constructor(@InjectModel(Interview.name) model: Model<Interview>) {
    super(model);
  }

  async findActiveByUserId(userId: string): Promise<Interview[]> {
    return this._model.find({
      userId,
      status: { $ne: InterviewStatus.CANCELLED },
      ...this._buildBaseFilter(),
    });
  }
}
```

---

### 3.7 DTOs and Validation

InterviewLab uses **class-based DTOs with `class-validator`** for ALL request body validation. This is a direct improvement over the source architecture which used guard-based field checking.

**Why class-based DTOs are better:**
- `class-validator` provides declarative, composable validation rules: `@IsEmail()`, `@IsEnum(InterviewMode)`, `@IsString()`, `@IsNotEmpty()`.
- The global `ValidationPipe` with `whitelist: true` automatically strips fields not declared in the DTO. No need for a separate `CheckAllowedFieldsGuard`.
- DTOs are self-documenting. A developer reading `CreateInterviewDto` immediately knows what fields the endpoint accepts and their validation rules.
- Swagger/OpenAPI auto-generates documentation from DTO class decorators via `@nestjs/swagger`.

```typescript
// create-interview.dto.ts
export class CreateInterviewDto {
  @IsEnum(InterviewMode)
  @ApiProperty({ enum: InterviewMode })
  mode: InterviewMode;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  focusArea?: string;
}
```

**Global ValidationPipe configuration:**
```typescript
// main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,        // Strip undeclared fields
  forbidNonWhitelisted: true,  // Throw on undeclared fields
  transform: true,        // Transform plain objects to class instances
}));
```

---

### 3.8 Authentication

InterviewLab uses the same **session-centric JWT pattern** as the source architecture. This is the correct choice:

- Stateless JWTs cannot be revoked. If a user logs out or changes their password, outstanding tokens remain valid until expiry.
- Session-centric JWT combines JWT's statefulness (no server query needed to decode the token) with revocability (a compromised token can be killed by deleting the session).

**JWT Payload:**
```typescript
interface JwtPayload {
  sub: string;        // userId
  sessionId: string;  // session document ID
  iat: number;
  exp: number;
}
```

**Auth Flow:**
```
POST /auth/register
  → ValidationPipe (CreateUserDto)
  → RateLimitGuard
  → AuthService.register()
      → Hash password
      → Create user document
      → Return { message: 'REGISTRATION_SUCCESS' }

POST /auth/login
  → ValidationPipe (LoginDto)
  → RateLimitGuard
  → AuthService.login()
      → Verify credentials
      → Create session document
      → Issue { accessToken, refreshToken }

POST /auth/refresh
  → AuthService.refreshTokens()
      → Find session by refreshToken hash
      → Rotate: revoke old, create new session
      → Issue new { accessToken, refreshToken }

POST /auth/logout
  → JwtAuthGuard
  → AuthService.logout()
      → Revoke session
```

**`JwtAuthGuard`:**
```typescript
@Injectable()
export class JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const token = this._extractToken(context);
    const payload = this._jwtService.verify(token);
    const session = await this._sessionRepository.findById(payload.sessionId);
    if (!session || !session.isActive) throw AppException.throw(AUTH_ERRORS.SESSION_REVOKED);
    // Attach to request
    context.switchToHttp().getRequest().user = payload;
    return true;
  }
}
```

**`@CheckAuth()` compound decorator (same pattern as `@CheckAccess()` from source):**
```typescript
export function CheckAuth(options: AuthOptions = { jwt: true }) {
  return applyDecorators(
    SetMetadata(AUTH_OPTIONS_KEY, options),
    UseGuards(JwtAuthGuard),
  );
}
```

**`@CurrentUser()` param decorator:**
```typescript
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayload => {
    return ctx.switchToHttp().getRequest().user;
  },
);
```

---

### 3.9 Error Handling

Same value-object pattern as source. Improved:

1. `AppException` is unchanged — same `AppException.throw(ERROR_CONSTANT)` idiom.
2. `GlobalExceptionFilter` is improved: uses `IAlertingService` interface instead of hardcoded Slack/ClickUp.
3. **Response envelope is now standardized.** All success responses are wrapped in `ApiResponse<T>`.

```typescript
// core/types/api-response.type.ts
export interface ApiResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**Why a response envelope:**  
The source architecture's weakness was inconsistent response shapes. Some endpoints returned raw documents, others returned `{ message: string }`, others returned `{ accessToken, refreshToken }`. Consumers must inspect each endpoint. A uniform envelope means the frontend `ApiService` can always unwrap `response.data` and know `response.success`.

The `ResponseWrapperInterceptor` automatically wraps all controller return values:

```typescript
@Injectable()
export class ResponseWrapperInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

---

### 3.10 Configuration

Same multi-environment object pattern as source. No change needed here — this is a clean design.

```typescript
// config/configuration.ts
export interface Config {
  port: number;
  environment: 'development' | 'production';
  database: { uri: string };
  auth: { jwtSecret: string; accessTokenExpiresIn: string; refreshTokenExpiresIn: string };
  ai: { geminiApiKey: string };
  storage: { type: 'local' | 's3'; localUploadPath?: string; s3?: S3Config };
  cors: { allowedOrigins: string[] };
}
```

**Startup secret validation (same pattern, adapted for InterviewLab):**
```typescript
const REQUIRED_SECRETS = [
  'DATABASE_URI',
  'JWT_SECRET',
  'GEMINI_API_KEY',
  'STORAGE_TYPE',
];
```

---

### 3.11 Logging

**Improvement over source:**

The source architecture noted that plain-string logging made ELK/Grafana integration hard. InterviewLab uses **Pino** (Fastify's native logger) with structured JSON output.

```typescript
// main.ts
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty' }
        : undefined,
    },
  }),
);
```

Every log entry includes: `requestId`, `method`, `url`, `statusCode`, `durationMs`, `userId` (when authenticated).

---

### 3.12 Swagger / OpenAPI

NestJS's `@nestjs/swagger` is configured at bootstrap. Every controller and DTO is decorated with `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth`. The Swagger UI is available at `/api/docs`.

```typescript
// main.ts
const config = new DocumentBuilder()
  .setTitle('InterviewLab API')
  .setDescription('AI-powered interview preparation platform API')
  .setVersion('1.0')
  .addBearerAuth()
  .addTag('Auth', 'Authentication and session management')
  .addTag('Users', 'User profile management')
  .addTag('CV', 'CV upload and analysis')
  .addTag('Interviews', 'Interview session management')
  .addTag('Questions', 'Interview question management')
  .addTag('Answers', 'Answer submission and processing')
  .addTag('Metrics', 'Interview performance metrics')
  .addTag('Notifications', 'In-app notifications')
  .build();
```

---

## 4. Frontend Architecture

### 4.1 Global Architecture Style

InterviewLab's Angular frontend is built on **Angular Standalone Components** (no NgModules) with **Angular Signals** for reactive state. This is the same approach as the source architecture.

**4-Tier Dependency Layering (adapted for InterviewLab):**

```
┌────────────────────────────────────────────────────────┐
│          Tier 4: Feature Layer                         │
│          (src/app/features/)                           │
└──────────────────────────┬─────────────────────────────┘
                           │ Imports from
┌──────────────────────────▼─────────────────────────────┐
│          Tier 3: Shared Domain Library                 │
│          (src/app/shared/)                             │
└──────────────────────────┬─────────────────────────────┘
                           │ Imports from
┌──────────────────────────▼─────────────────────────────┐
│          Tier 2: Core Library                          │
│          (src/app/core/)                               │
└──────────────────────────┬─────────────────────────────┘
                           │ Imports from
┌──────────────────────────▼─────────────────────────────┐
│          Tier 1: Angular Platform + Libraries          │
│          (@angular/*, @angular/material, rxjs)         │
└────────────────────────────────────────────────────────┘
```

**Rule: Upper tiers may import from lower tiers. Lower tiers NEVER import from upper tiers.**

This is not merely a convention — it is an architectural invariant. If `core/` imports from `features/`, the core becomes coupled to feature implementations, making it impossible to reuse or test in isolation.

---

### 4.2 Core Layer (`src/app/core/`)

The core layer provides infrastructure that is available application-wide. It is never feature-specific.

#### `core/auth/`
- `auth.service.ts` — Login, register, logout, token management.
- `auth.store.ts` — Signal-based store for authenticated user state. Exposes `currentUser = signal<User | null>(null)`, `isAuthenticated = computed(() => !!this.currentUser())`.
- `token.service.ts` — Wraps `localStorage` for JWT storage. Single point of token read/write. If the storage strategy changes (e.g., httpOnly cookies via a proxy), only this file changes.
- `jwt-auth.guard.ts` — Functional guard. Reads `authStore.isAuthenticated()`. Redirects to `/auth/login` if false.
- `no-auth.guard.ts` — Redirects authenticated users away from `/auth/*` routes.

**Why `TokenService` instead of direct `localStorage`:**  
The source architecture's weakness #4 was "Single-Token Local Storage Dependency": `ApiService` read `localStorage` directly. If the storage strategy changes, every place that reads the token must change. `TokenService` is the single contract. Changing storage means changing one class.

#### `core/http/`
- `api.service.ts` — Base HTTP service. Prepends `environment.apiUrl`. Unwraps `ApiResponse<T>` envelope.
- `auth.interceptor.ts` — Attaches `Authorization: Bearer <token>` header to every request.
- `token-refresh.interceptor.ts` — Catches 401 responses, refreshes the token, and retries the original request.
- `error.interceptor.ts` — Catches HTTP errors, maps error codes to display messages via `TranslateService`.

#### `core/store/`
- `base.store.ts` — Generic signal-based state container. Provides `state = signal<TState>(initialState)`, `setState(partial)`, `resetState()`.
- `list.store.ts` — Extends `BaseStore` with paginated list state: `entities`, `totalCount`, `currentPage`, `pageSize`, `loading`, `error`.

**`BaseStore<TState>` design:**
```typescript
export class BaseStore<TState> {
  protected _state: WritableSignal<TState>;

  readonly state = this._state.asReadonly();

  protected setState(partial: Partial<TState>): void {
    this._state.update((current) => ({ ...current, ...partial }));
  }

  protected resetState(): void {
    this._state.set(this._initialState);
  }
}
```

**Why signals instead of NgRx:**
- NgRx adds enormous boilerplate: actions, reducers, effects, selectors, facades — for state that could be a signal.
- Angular signals are first-class primitives. They integrate with change detection (`OnPush` is the default). They are simpler to test.
- For InterviewLab's complexity level (user state, session state, metrics state), signals are the right tool. NgRx would be appropriate if the application had complex cross-feature state sharing with time-travel debugging needs.
- The `BaseStore<TState>` class provides the structural discipline that pure signals lack: a single state object, immutable updates, reset capability.

#### `core/interceptors/`
- `auth.interceptor.ts`
- `token-refresh.interceptor.ts`
- `error.interceptor.ts`
- `loading.interceptor.ts` — Tracks in-flight requests for global loading state.

#### `core/guards/`
- `jwt-auth.guard.ts`
- `no-auth.guard.ts`

#### `core/models/`
Shared TypeScript interfaces representing backend response shapes. These are NOT classes — they are interfaces.

```typescript
// core/models/user.model.ts
export interface User {
  id: string;
  email: string;
  name: string;
  preferredLanguage: string;
  createdAt: string;
}

// core/models/interview.model.ts
export interface Interview {
  id: string;
  userId: string;
  mode: InterviewMode;
  status: InterviewStatus;
  startedAt?: string;
  endedAt?: string;
  overallScore?: number;
}
```

**Why interfaces and not classes:**  
Classes in TypeScript add runtime weight (prototypes, constructors). HTTP response data is plain JSON. There is no behavior on these objects — they are data shapes. Interfaces are zero runtime cost and provide full type checking.

#### `core/utils/`
Pure utility functions. No dependencies. No DI.

- `date.utils.ts` — Date formatting, relative time.
- `string.utils.ts` — Truncation, capitalization.
- `audio.utils.ts` — Duration formatting, byte size formatting.
- `transcript.utils.ts` — Filler word detection, word count.

---

### 4.3 Shared Layer (`src/app/shared/`)

Reusable UI components, directives, and pipes that are used across multiple features but are not infrastructure.

#### `shared/components/`

| Component | Purpose | Smart or Dumb |
|---|---|---|
| `WaveformComponent` | Audio waveform visualizer using Canvas API | Dumb — accepts `audioData: Float32Array` input |
| `ScoreGaugeComponent` | Circular score gauge for session scores | Dumb — accepts `score: number`, `label: string` |
| `ProgressBarComponent` | Animated progress bar | Dumb |
| `CardComponent` | Standard card container with header and actions slots | Dumb |
| `EmptyStateComponent` | Empty state illustration with message | Dumb |
| `LoadingSpinnerComponent` | Loading indicator | Dumb |
| `ConfirmDialogComponent` | Reusable confirmation dialog | Smart (manages dialog state) |
| `NotificationToastComponent` | Toast notification display | Smart (reads NotificationService) |
| `BaseTableComponent<T>` | Generic paginated table | Dumb — accepts data, columns, events |
| `MetricsChartComponent` | Chart.js wrapper for metrics display | Dumb — accepts ChartData input |

**Why `BaseTableComponent<T>`:**  
In the source architecture, `AbstractTableWidget<T>` was a base class that handled row editing, pagination events, sorting events, and cancel/rollback logic. This avoids duplicating pagination and sort-handling code in every table component. InterviewLab's table pattern is simpler (no inline row editing needed), but the base component still handles:
- Pagination events → emits `pageChange` output
- Sort events → emits `sortChange` output
- Loading state display
- Empty state display

Feature-specific tables extend or embed it.

#### `shared/directives/`
- `AutoFocusDirective` — Auto-focuses the host element when shown.
- `ClickOutsideDirective` — Emits when a click occurs outside the host element.
- `ResizeObserverDirective` — Emits when the host element size changes (used for waveform canvas resizing).

#### `shared/pipes/`
- `DurationPipe` — Formats seconds as `mm:ss`.
- `ScorePipe` — Formats a 0–100 score as a labeled percentage.
- `RelativeDatePipe` — "2 hours ago", "yesterday".
- `FillerWordHighlightPipe` — Wraps filler words in `<mark>` tags within transcript text.

#### `shared/validators/`
Custom Angular reactive form validators:
- `passwordStrengthValidator` — Minimum length, one uppercase, one number.
- `matchFieldValidator(fieldName: string)` — Cross-field match (confirm password).

---

### 4.4 Feature Layer (`src/app/features/`)

Each feature is a self-contained Angular Standalone Component group. Features are lazily loaded via the router.

| Feature | Route | Description |
|---|---|---|
| `auth` | `/auth` | Login, register, forgot password |
| `dashboard` | `/` | Overview: recent sessions, progress charts |
| `profile` | `/profile` | Candidate profile, CV upload, skills display |
| `interview` | `/interview` | Interview session: active session UI, question display, voice recording |
| `history` | `/history` | Past sessions list, session detail |
| `analytics` | `/analytics` | Progress charts, skill evolution, trend analysis |
| `settings` | `/settings` | App settings, notification preferences, language |

**Feature internal structure:**
```
features/{name}/
├── {name}.routes.ts           ← Lazy-loaded routes
├── pages/
│   ├── {name}-list/
│   │   ├── {name}-list.page.ts       ← Smart component
│   │   └── {name}-list.store.ts      ← Page-level signal store
│   └── {name}-detail/
│       ├── {name}-detail.page.ts
│       └── {name}-detail.store.ts
├── components/
│   └── {name}-card/
│       └── {name}-card.component.ts  ← Dumb component
├── services/
│   └── {name}.api.service.ts         ← HTTP calls for this feature
└── models/
    └── {name}.model.ts               ← Feature-specific DTOs
```

**Why page-level stores instead of global stores:**  
The source architecture used page-level stores (`OccasionListPageStore`) that extend `ListStore`. This is the right design for most state: list filters, pagination, and loading state are ephemeral and belong to the page lifecycle, not the global application state. Only genuinely global state (authenticated user, active interview session) lives in application-level stores in `core/`.

---

### 4.5 Interview Feature (Most Complex Feature)

The interview feature deserves special architectural attention because it manages:
1. Real-time voice recording via `MediaRecorder API`
2. Real-time speech recognition via `Web Speech API`
3. Live transcript display
4. Timer management
5. Session state progression (question → answer → next question)

**`InterviewSessionStore` (application-level, in `core/`):**

Because an active interview session must be accessible from multiple places (header shows session timer, interview page shows the active question, a background service monitors audio), the active session store lives in `core/`:

```typescript
// core/stores/active-interview.store.ts
export class ActiveInterviewStore extends BaseStore<ActiveInterviewState> {
  readonly isActive = computed(() => !!this.state().sessionId);
  readonly currentQuestion = computed(() => this.state().currentQuestion);
  readonly transcript = computed(() => this.state().transcript);
  readonly timer = computed(() => this.state().elapsedSeconds);

  startSession(session: Interview): void { ... }
  setCurrentQuestion(question: Question): void { ... }
  updateTranscript(text: string): void { ... }
  tickTimer(): void { ... }
  endSession(): void { ... }
}
```

**`SpeechRecognitionService` (in `core/speech/`):**

This service wraps the browser's `Web Speech API` and the `MediaRecorder API`. It is in `core/` because it is infrastructure, not feature business logic.

```typescript
// core/speech/speech-recognition.service.ts
export class SpeechRecognitionService {
  private _recognition: SpeechRecognition;
  private _mediaRecorder: MediaRecorder;

  readonly transcript$ = new BehaviorSubject<string>('');
  readonly isListening = signal(false);
  readonly audioChunks = signal<Blob[]>([]);

  startListening(): void { ... }
  stopListening(): Observable<SpeechResult> { ... }
  getAudioBlob(): Blob { ... }
}
```

**`InterviewSessionPage` (Smart component, in `features/interview/`):**

```
InterviewSessionPage (Smart)
├── Reads: ActiveInterviewStore (signals)
├── Injects: SpeechRecognitionService, InterviewApiService
├── Contains:
│   ├── QuestionDisplayComponent (Dumb) — shows current question text
│   ├── WaveformComponent (Dumb) — real-time audio waveform
│   ├── TranscriptDisplayComponent (Dumb) — live transcript
│   ├── SessionTimerComponent (Dumb) — elapsed time
│   └── AnswerActionsComponent (Dumb) — start/stop/submit buttons
```

---

### 4.6 Routing

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes),
    canActivate: [noAuthGuard],
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [jwtAuthGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/dashboard/pages/dashboard.page').then(m => m.DashboardPage),
      },
      {
        path: 'profile',
        loadChildren: () => import('./features/profile/profile.routes').then(m => m.profileRoutes),
      },
      {
        path: 'interview',
        loadChildren: () => import('./features/interview/interview.routes').then(m => m.interviewRoutes),
      },
      {
        path: 'history',
        loadChildren: () => import('./features/history/history.routes').then(m => m.historyRoutes),
      },
      {
        path: 'analytics',
        loadChildren: () => import('./features/analytics/analytics.routes').then(m => m.analyticsRoutes),
      },
      {
        path: 'settings',
        loadChildren: () => import('./features/settings/settings.routes').then(m => m.settingsRoutes),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
```

**Why lazy loading every feature:**  
The initial bundle contains only the app shell, router, and core services. Each feature is downloaded only when first navigated to. This is critical for an AI-heavy application where the interview page (with heavy Chart.js, waveform canvas code) should not block the login page from loading.

---

### 4.7 HTTP Layer

```
Feature Page (Smart Component)
  → Feature API Service (extends BaseApiService)
    → HttpClient
      ← AuthInterceptor (attaches token)
      ← TokenRefreshInterceptor (handles 401)
      ← ErrorInterceptor (maps errors to messages)
      ← LoadingInterceptor (tracks in-flight count)
```

**`BaseApiService<T>`:**
```typescript
// core/http/base-api.service.ts
export abstract class BaseApiService<T> {
  protected abstract readonly path: string;

  constructor(protected readonly _http: HttpClient) {}

  protected get baseUrl(): string {
    return `${environment.apiUrl}/${this.path}`;
  }

  findAll(params?: HttpParams): Observable<PaginatedApiResponse<T>> {
    return this._http.get<PaginatedApiResponse<T>>(this.baseUrl, { params });
  }

  findById(id: string): Observable<ApiResponse<T>> {
    return this._http.get<ApiResponse<T>>(`${this.baseUrl}/${id}`);
  }

  create(body: unknown): Observable<ApiResponse<T>> {
    return this._http.post<ApiResponse<T>>(this.baseUrl, body);
  }

  update(id: string, body: unknown): Observable<ApiResponse<T>> {
    return this._http.patch<ApiResponse<T>>(`${this.baseUrl}/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this._http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
```

Feature-specific API services extend it:
```typescript
// features/interview/services/interview.api.service.ts
@Injectable({ providedIn: 'root' })
export class InterviewApiService extends BaseApiService<Interview> {
  protected override readonly path = 'interviews';

  startSession(id: string): Observable<ApiResponse<Interview>> {
    return this._http.post<ApiResponse<Interview>>(`${this.baseUrl}/${id}/start`, {});
  }

  submitAnswer(interviewId: string, body: SubmitAnswerDto): Observable<ApiResponse<Answer>> {
    return this._http.post<ApiResponse<Answer>>(`${this.baseUrl}/${interviewId}/answers`, body);
  }
}
```

---

### 4.8 Theme and Styling

```
styles.scss
├── @use 'tailwindcss'           ← Tailwind utilities and base reset
├── @use 'themes/material'       ← Angular Material custom theme
└── @use 'themes/tokens'         ← CSS custom properties (design tokens)
```

**Design tokens (`themes/tokens.scss`):**
```scss
:root {
  --color-primary: #6366f1;       // Indigo-500 — primary brand
  --color-primary-dark: #4f46e5;  // Indigo-600 — hover state
  --color-accent: #22d3ee;        // Cyan-400 — AI/speech indicator
  --color-danger: #f43f5e;        // Rose-500 — errors, cancel
  --color-success: #22c55e;       // Green-500 — success, high scores
  --color-warn: #f59e0b;          // Amber-500 — warnings, medium scores

  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;  // Transcript display

  --radius-sm: 0.375rem;
  --radius-md: 0.75rem;
  --radius-lg: 1.5rem;
  --shadow-card: 0 4px 24px rgb(0 0 0 / 0.08);
}
```

**CSS Layering Strategy:**  
Angular Material components use `ViewEncapsulation.None` or `::ng-deep` for theming. Tailwind utilities are applied for layout. There is no conflict because Angular Material handles component theming through Angular's theming API, and Tailwind handles layout/spacing. The two systems operate in separate domains.

---

### 4.9 Internationalization

`ngx-translate` is configured at the application level:

```typescript
// app.config.ts
provideTranslateService({
  loader: {
    provide: TranslateLoader,
    useFactory: (http: HttpClient) => new TranslateHttpLoader(http, './assets/i18n/', '.json'),
    deps: [HttpClient],
  },
  defaultLanguage: 'en',
})
```

Translation files:
```
assets/i18n/
├── en.json    ← English (default)
└── fr.json    ← French
```

Error codes from the backend (`INVALID_TOKEN`, `NO_PROFILE`, etc.) are mapped in translation files:
```json
{
  "ERRORS": {
    "INVALID_TOKEN": "Your session has expired. Please log in again.",
    "NO_PROFILE": "Please upload your CV to start an interview."
  }
}
```

---

### 4.10 Charts

Chart.js is used for analytics and metrics visualization. A `ChartService` wrapper provides:
- Chart instance management (create, update, destroy lifecycle).
- Pre-configured chart types for InterviewLab: `LineChart` (progress over time), `RadarChart` (skill dimensions), `BarChart` (metric comparison).

A `MetricsChartComponent` in `shared/components/` wraps Chart.js with `ngOnChanges` lifecycle to update the chart when `@Input() data` changes.

---

## 5. Database Design

### 5.1 Collections

#### `users`
The authentication identity. Separate from the candidate profile by design.

```
_id              ObjectId       PK
email            String         UNIQUE INDEX
passwordHash     String         select: false
name             String
preferredLanguage String        default: 'en'
createdAt        Date
updatedAt        Date
lastLoginAt      Date
```

**Why separate from candidate_profiles:**  
A user might exist without a profile (they registered but haven't uploaded a CV yet). The candidate profile is created after CV analysis, not at registration. Keeping them separate avoids null fields on the user document and keeps authentication concerns out of the profile domain.

#### `user_sessions`
JWT session tracking. Enables session revocation.

```
_id              ObjectId
userId           ObjectId       ref: users, INDEX
accessTokenHash  String         INDEX
refreshTokenHash String         INDEX
isActive         Boolean        default: true
userAgent        String
ipAddress        String
expiresAt        Date
refreshExpiresAt Date
revokedAt        Date?
createdAt        Date
```

#### `candidate_profiles`
CV-derived candidate profile. Created once, updated on re-upload.

```
_id              ObjectId
userId           ObjectId       ref: users, UNIQUE INDEX
cvUrl            String         URL of the uploaded CV file
cvFileName       String
cvUploadedAt     Date
summary          String         AI-generated summary
skills           String[]       Extracted skills
technologies     String[]       Extracted tech stack
experience       ExperienceEntry[]
projects         ProjectEntry[]
strengths        String[]       AI-identified strengths
weaknesses       String[]       AI-identified areas for improvement
analysisStatus   Enum           PENDING | COMPLETED | FAILED
createdAt        Date
updatedAt        Date
```

**Embedded sub-documents:**
```
ExperienceEntry: { title, company, years, description }
ProjectEntry:    { name, description, technologies[] }
```

**Why embed experience and projects:**  
These sub-documents are always loaded with the profile — they are never queried independently. Embedding avoids a separate collection and join. MongoDB is a document database; embedding co-located data is idiomatic.

#### `interviews`
Interview session lifecycle.

```
_id                  ObjectId
userId               ObjectId       ref: users, INDEX
candidateProfileId   ObjectId       ref: candidate_profiles
mode                 Enum           HR | TECHNICAL | MIXED
status               Enum           PENDING | IN_PROGRESS | COMPLETED | CANCELLED
questionCount        Number         total questions generated
currentQuestionIndex Number         which question the user is on
startedAt            Date?
endedAt              Date?
durationSeconds      Number?        computed on completion
overallScore         Number?        0–100
communicationScore   Number?        0–100
technicalScore       Number?        0–100
confidenceScore      Number?        0–100 (computed from metrics)
aiFeedback           String?        AI-generated session summary
createdAt            Date
```

**Index:** `userId` — for fetching a user's session history.

#### `questions`
Questions generated by AI for a session.

```
_id           ObjectId
interviewId   ObjectId       ref: interviews, INDEX
order         Number         1-based ordering
text          String         the question text
type          Enum           HR | TECHNICAL
difficulty    Enum           EASY | MEDIUM | HARD
topic         String?        e.g., 'System Design', 'Behavioral'
generatedByAI Boolean        always true in v1
createdAt     Date
```

**Index:** `interviewId` — for fetching all questions for a session.

**Why questions are separate from the interview document:**  
An interview can have 10–20 questions. Embedding them in the interview document would make the interview document large and difficult to update incrementally (e.g., generating question 2 after question 1 is answered). Separate documents allow efficient per-question operations.

#### `answers`
The user's answer to a question.

```
_id              ObjectId
questionId       ObjectId       ref: questions, UNIQUE INDEX (one answer per question)
interviewId      ObjectId       ref: interviews, INDEX
userId           ObjectId       ref: users
transcript       String         speech-to-text result
audioUrl         String?        URL of the stored audio file
durationSeconds  Number         how long the user spoke
submittedAt      Date
createdAt        Date
```

**Index:** `interviewId` — for fetching all answers for a session.

#### `interview_metrics`
Deterministic metrics computed from the answer transcript. One document per answer.

```
_id                  ObjectId
answerId             ObjectId       ref: answers, UNIQUE INDEX
interviewId          ObjectId       ref: interviews, INDEX
wordsPerMinute       Number
averagePauseDuration Number?        in milliseconds
longestPause         Number?        in milliseconds
fillerWordCount      Number
fillerWords          String[]       which filler words were detected
repeatedWordCount    Number
repeatedWords        String[]
vocabularyRichness   Number         unique words / total words (0–1)
answerDuration       Number         in seconds
createdAt            Date
```

#### `ai_evaluations`
AI-generated qualitative evaluation. Separate from metrics because they are produced by different systems (deterministic vs. generative AI).

```
_id               ObjectId
answerId          ObjectId       ref: answers, UNIQUE INDEX
interviewId       ObjectId       ref: interviews, INDEX
technicalScore    Number?        0–100 (AI judgment)
semanticScore     Number?        0–100 (AI judgment — relevance)
missingConcepts   String[]       key points not covered
communicationTips String[]       AI suggestions
idealAnswer       String?        AI's suggested ideal answer
rawAiResponse     String         full Gemini response (for debugging)
promptVersion     String         which prompt template was used
createdAt         Date
```

**Why `ai_evaluations` is separate from `interview_metrics`:**  
This is one of the most important architectural decisions. See Section 8 (Metrics Engine) for full explanation.

#### `notifications`
In-app notifications for the user.

```
_id         ObjectId
userId      ObjectId       ref: users, INDEX
type        Enum           SESSION_COMPLETE | CV_ANALYZED | REMINDER
title       String
body        String
isRead      Boolean        default: false, INDEX
relatedId   ObjectId?      ref to the relevant document (interview, etc.)
createdAt   Date
```

#### `user_settings`
Per-user application settings.

```
_id                    ObjectId
userId                 ObjectId       ref: users, UNIQUE INDEX
language               String         default: 'en'
notificationsEnabled   Boolean        default: true
interviewReminders     Boolean        default: true
updatedAt              Date
```

#### `constants`
System-wide configuration thresholds. Admin-managed.

```
_id         ObjectId
name        String         UNIQUE
description String
thresholds: {
  fillerWordWarningCount   Number   e.g., 5
  pauseWarningMs           Number   e.g., 2000
  minWordsPerMinute        Number   e.g., 80
  maxWordsPerMinute        Number   e.g., 180
  vocabularyRichnessMin    Number   e.g., 0.4
}
updatedAt   Date
```

**Why a `constants` collection:**  
Hard-coded thresholds (what counts as "too many filler words") change as we learn from real user data. Storing them in the database and exposing them to an admin panel means no redeployment is needed to tune the metrics engine.

---

### 5.2 Relationships

```
User (1) ──────────────── (N) UserSession
User (1) ──────────────── (1) CandidateProfile
User (1) ──────────────── (N) Interview
Interview (1) ─────────── (N) Question
Interview (1) ─────────── (N) Answer
Question (1) ──────────── (1) Answer
Answer (1) ────────────── (1) InterviewMetrics
Answer (1) ────────────── (1) AiEvaluation
User (1) ──────────────── (N) Notification
User (1) ──────────────── (1) UserSettings
```

---

### 5.3 Indexes Summary

| Collection | Field | Type | Reason |
|---|---|---|---|
| `users` | `email` | UNIQUE | Login lookup |
| `user_sessions` | `userId` | Non-unique | Fetch user's sessions |
| `user_sessions` | `accessTokenHash` | Non-unique | Token validation |
| `user_sessions` | `refreshTokenHash` | Non-unique | Token refresh |
| `candidate_profiles` | `userId` | UNIQUE | One profile per user |
| `interviews` | `userId` | Non-unique | Session history |
| `questions` | `interviewId` | Non-unique | Fetch session questions |
| `answers` | `interviewId` | Non-unique | Fetch session answers |
| `answers` | `questionId` | UNIQUE | One answer per question |
| `interview_metrics` | `answerId` | UNIQUE | One metrics doc per answer |
| `ai_evaluations` | `answerId` | UNIQUE | One AI evaluation per answer |
| `notifications` | `userId` | Non-unique | User notification feed |
| `notifications` | `isRead` | Non-unique | Unread count query |
| `user_settings` | `userId` | UNIQUE | One settings doc per user |

---

## 6. AI Architecture

### 6.1 Design: Provider Interface Pattern

The AI system is built behind an interface. No module in InterviewLab imports the Gemini SDK directly. Only the `AIModule` and its internal provider classes know about Gemini.

```
AIService (Application-level facade)
    │
    ▼
IAIProvider (Interface / Port)
    │
    ├── GeminiProvider (Adapter — current implementation)
    └── OpenAIProvider (Adapter — future, plug-in without changes elsewhere)
```

**Why this matters:**
- Gemini is Google's current model. AI providers change rapidly. OpenAI, Anthropic, and Mistral all offer competing APIs.
- If InterviewLab wanted to switch from Gemini to GPT-4o, only `GeminiProvider` needs to be replaced. No interviewing logic, no question generation service, no CV analysis service changes.
- Provider selection can be configuration-driven: `AI_PROVIDER=gemini` in environment variables. The correct provider is injected via NestJS DI.
- This pattern is equivalent to how the source architecture used `StripeService` as an adapter. The lesson is the same: external vendor APIs must be behind an interface.

### 6.2 Interface Definition

```typescript
// modules/ai/interfaces/ai-provider.interface.ts
export interface IAIProvider {
  // CV Analysis
  analyzeCv(cvText: string): Promise<CvAnalysisResult>;

  // Question Generation
  generateQuestions(profile: ProfileContext, mode: InterviewMode, count: number): Promise<GeneratedQuestion[]>;

  // Answer Evaluation
  evaluateAnswer(question: string, transcript: string, profileContext: string): Promise<AnswerEvaluationResult>;

  // Session Summary
  generateSessionSummary(sessionContext: SessionContext): Promise<SessionSummary>;
}

// modules/ai/interfaces/ai-results.interface.ts
export interface CvAnalysisResult {
  summary: string;
  skills: string[];
  technologies: string[];
  strengths: string[];
  weaknesses: string[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
}

export interface AnswerEvaluationResult {
  technicalScore: number;
  semanticScore: number;
  missingConcepts: string[];
  communicationTips: string[];
  idealAnswer: string;
}
```

### 6.3 Gemini Provider Implementation

```typescript
// modules/ai/providers/gemini.provider.ts
@Injectable()
export class GeminiProvider implements IAIProvider {
  private _client: GoogleGenerativeAI;
  private _model: GenerativeModel;

  constructor(private readonly _config: ConfigService) {
    this._client = new GoogleGenerativeAI(this._config.get('ai.geminiApiKey'));
    this._model = this._client.getGenerativeModel({ model: 'gemini-1.5-pro' });
  }

  async analyzeCv(cvText: string): Promise<CvAnalysisResult> {
    const prompt = this._buildCvAnalysisPrompt(cvText);
    const result = await this._model.generateContent(prompt);
    return this._parseCvAnalysisResponse(result.response.text());
  }

  async generateQuestions(profile: ProfileContext, mode: InterviewMode, count: number): Promise<GeneratedQuestion[]> {
    const prompt = this._buildQuestionGenerationPrompt(profile, mode, count);
    const result = await this._model.generateContent(prompt);
    return this._parseQuestionsResponse(result.response.text());
  }

  // ... other methods

  private _buildCvAnalysisPrompt(cvText: string): string {
    return `You are an expert technical recruiter. Analyze the following CV and extract structured information.

CV Content:
${cvText}

Return a JSON object with this exact structure:
{
  "summary": "2-3 sentence professional summary",
  "skills": ["skill1", "skill2"],
  "technologies": ["tech1", "tech2"],
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "experience": [{ "title": "", "company": "", "years": 0, "description": "" }],
  "projects": [{ "name": "", "description": "", "technologies": [] }]
}

Return ONLY the JSON object, no markdown, no explanation.`;
  }
}
```

### 6.4 AI Module

```typescript
// modules/ai/ai.module.ts
export const AI_PROVIDER_TOKEN = 'AI_PROVIDER';

@Module({
  providers: [
    AIService,
    {
      provide: AI_PROVIDER_TOKEN,
      useClass: GeminiProvider,  // Swap this to change providers
    },
  ],
  exports: [AIService],
})
export class AIModule {}
```

**`AIService` is the public API — it never exposes provider internals:**
```typescript
// modules/ai/ai.service.ts
@Injectable()
export class AIService {
  constructor(
    @Inject(AI_PROVIDER_TOKEN) private readonly _provider: IAIProvider,
  ) {}

  async analyzeCv(cvText: string): Promise<CvAnalysisResult> {
    try {
      return await this._provider.analyzeCv(cvText);
    } catch (error) {
      this._logger.error('CV analysis failed', error);
      AppException.throw(AI_ERRORS.ANALYSIS_FAILED);
    }
  }
  // ... delegates to provider
}
```

### 6.5 AI Flow

```
User uploads CV
  → CvController.upload()
  → CvService.processUpload(userId, file)
      → StorageService.store(file)  → Returns cvUrl
      → CvService.extractText(file) → Returns plain text
      → CandidateProfileService.updateStatus(userId, 'PENDING')
      → AIService.analyzeCv(cvText)
          → GeminiProvider.analyzeCv()  → Gemini API
          → Returns CvAnalysisResult
      → CandidateProfileService.saveAnalysis(userId, result)
      → NotificationService.create(userId, 'CV_ANALYZED')
      → Returns { message: 'CV_ANALYSIS_COMPLETE' }
```

```
User starts interview
  → InterviewController.create()
  → InterviewService.createSession(userId, dto)
      → CandidateProfileService.findByUserId(userId)  → Get profile + summary
      → InterviewRepository.create(sessionData)
      → AIService.generateQuestions(profile, mode, count)
          → GeminiProvider.generateQuestions()  → Gemini API
          → Returns GeneratedQuestion[]
      → QuestionService.bulkCreate(sessionId, questions)
      → Returns Interview + Questions
```

```
User submits answer
  → AnswerController.create()
  → AnswerService.submit(userId, interviewId, dto)
      → Validate interview ownership
      → AnswerRepository.create({ transcript, audioUrl, durationSeconds })
      → MetricsService.compute(answerId, transcript, dto.durationSeconds)
          → Returns computed metrics (no AI involved)
      → AIService.evaluateAnswer(question.text, transcript, profileSummary)
          → GeminiProvider.evaluateAnswer()  → Gemini API
          → Returns AnswerEvaluationResult
      → AiEvaluationRepository.create(evaluation)
      → QuestionService.advanceSessionQuestion(interviewId)
      → Returns { answer, metrics, evaluation }
```

---

## 7. Speech Architecture

### 7.1 Design Philosophy

Speech processing is **not** AI. This is a critical architectural distinction.

Speech recognition converts audio to text. This is a deterministic browser capability (Web Speech API). It does not require Gemini, does not require any external API, and can work offline.

Audio recording captures the raw audio stream (MediaRecorder API). This is file I/O.

Confusing speech processing with AI would create a coupled mess where the AI module becomes responsible for browser APIs.

### 7.2 Responsibilities and Placement

| Responsibility | Service | Location |
|---|---|---|
| Audio recording (start/stop/capture) | `AudioRecorderService` | `core/speech/` |
| Speech recognition (voice → text) | `SpeechRecognitionService` | `core/speech/` |
| Real-time transcript display | `TranscriptDisplayComponent` | `shared/components/` |
| Transcript validation (min length, language) | `TranscriptValidationService` | `core/speech/` |
| Audio file upload after recording | `AudioUploadService` | `core/speech/` |
| Coordinating the above for an interview answer | `SpeechProcessingService` | `modules/speech/` (backend) |

**Note:** The `core/speech/` services are Angular frontend services. The `modules/speech/` on the backend handles server-side coordination (storing audio URL, triggering metrics computation).

### 7.3 Frontend Speech Services

#### `AudioRecorderService`
```typescript
// core/speech/audio-recorder.service.ts
@Injectable({ providedIn: 'root' })
export class AudioRecorderService {
  private _mediaRecorder: MediaRecorder | null = null;
  private _chunks: Blob[] = [];

  readonly isRecording = signal(false);

  async startRecording(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this._mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    this._mediaRecorder.ondataavailable = (e) => this._chunks.push(e.data);
    this._mediaRecorder.start(100); // Collect chunks every 100ms
    this.isRecording.set(true);
  }

  stopRecording(): Blob {
    this._mediaRecorder?.stop();
    this.isRecording.set(false);
    return new Blob(this._chunks, { type: 'audio/webm' });
  }
}
```

#### `SpeechRecognitionService`
```typescript
// core/speech/speech-recognition.service.ts
@Injectable({ providedIn: 'root' })
export class SpeechRecognitionService {
  private _recognition: SpeechRecognition;
  readonly interimTranscript = signal('');
  readonly finalTranscript = signal('');
  readonly isListening = signal(false);

  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this._recognition = new SpeechRecognition();
    this._recognition.continuous = true;
    this._recognition.interimResults = true;
    this._recognition.onresult = (event) => this._handleResult(event);
    this._recognition.onerror = (event) => this._handleError(event);
  }

  start(language: string = 'en-US'): void {
    this._recognition.lang = language;
    this._recognition.start();
    this.isListening.set(true);
  }

  stop(): string {
    this._recognition.stop();
    this.isListening.set(false);
    return this.finalTranscript();
  }

  private _handleResult(event: SpeechRecognitionEvent): void {
    let interim = '';
    let final = this.finalTranscript();
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) final += result[0].transcript + ' ';
      else interim = result[0].transcript;
    }
    this.finalTranscript.set(final);
    this.interimTranscript.set(interim);
  }
}
```

#### `TranscriptValidationService`
```typescript
// core/speech/transcript-validation.service.ts
@Injectable({ providedIn: 'root' })
export class TranscriptValidationService {
  validate(transcript: string): TranscriptValidationResult {
    const wordCount = transcript.trim().split(/\s+/).length;
    const isMinLength = wordCount >= 10;
    const isMaxLength = wordCount <= 1000;
    const isEmpty = !transcript.trim();

    return {
      isValid: !isEmpty && isMinLength && isMaxLength,
      wordCount,
      errors: [
        ...(isEmpty ? ['TRANSCRIPT_EMPTY'] : []),
        ...(!isMinLength ? ['TRANSCRIPT_TOO_SHORT'] : []),
        ...(!isMaxLength ? ['TRANSCRIPT_TOO_LONG'] : []),
      ],
    };
  }
}
```

### 7.4 Speech Flow

```
User clicks "Start Answering"
  ↓
InterviewSessionPage calls:
  → AudioRecorderService.startRecording()     ← MediaRecorder API
  → SpeechRecognitionService.start(language)  ← Web Speech API
  ↓
Real-time updates:
  → SpeechRecognitionService.interimTranscript() → TranscriptDisplayComponent (live)
  → AudioRecorderService.isRecording() → WaveformComponent (live waveform)
  ↓
User clicks "Stop Answering"
  → SpeechRecognitionService.stop() → finalTranscript: string
  → AudioRecorderService.stopRecording() → audioBlob: Blob
  → TranscriptValidationService.validate(transcript) → valid: boolean
  ↓
If valid:
  → InterviewApiService.submitAnswer({
      transcript,
      durationSeconds,
      audioBlob → uploaded as multipart
    })
  → Backend: AnswerService.submit()
      → Store audio file → S3/local
      → MetricsService.compute(transcript)     ← DETERMINISTIC
      → AIService.evaluateAnswer(transcript)   ← GENERATIVE AI
  ↓
Response displayed to user (score, feedback, metrics)
```

---

## 8. Metrics Engine

### 8.1 Design Philosophy: Deterministic vs. Generative

The Metrics Engine is architecturally independent from AI. This separation is one of the most important decisions in the entire architecture.

**Why they must be separate:**

| Aspect | Metrics Engine | AI Evaluation |
|---|---|---|
| Nature | Deterministic algorithm | Generative AI (probabilistic) |
| Input | Transcript text + timing data | Transcript + question + profile |
| Output | Numbers (count, ratio, ms) | Qualitative text + scores |
| Reproducibility | Same input → always same output | Same input → may vary |
| Testability | Unit testable with pure functions | Requires mocking/stubbing AI |
| Cost | Zero (CPU computation) | Costs API credits |
| Latency | Microseconds | Seconds |
| Dependencies | None | Gemini API availability |

**If metrics were computed by Gemini:**
- Every test of the metrics system would require Gemini API calls.
- A Gemini outage would break speaking speed computation.
- Metric values would be inconsistent — Gemini might count filler words differently each time.
- API costs would be unnecessarily high.

**The insight:** Counting filler words, computing speaking speed, and measuring pauses are **data processing problems**, not AI problems. AI is for semantic judgment, not counting.

### 8.2 Metrics Module (Backend)

```typescript
// modules/metrics/metrics.service.ts
@Injectable()
export class MetricsService {
  constructor(
    private readonly _metricsRepository: MetricsRepository,
    private readonly _constantsService: ConstantsService,
  ) {}

  async compute(answerId: string, transcript: string, durationSeconds: number): Promise<InterviewMetrics> {
    const constants = await this._constantsService.getThresholds();
    const words = this._tokenize(transcript);

    const metrics = {
      answerId,
      wordsPerMinute: this._computeWPM(words.length, durationSeconds),
      fillerWordCount: this._countFillerWords(words),
      fillerWords: this._extractFillerWords(words),
      repeatedWordCount: this._countRepeatedWords(words),
      repeatedWords: this._extractRepeatedWords(words),
      vocabularyRichness: this._computeVocabularyRichness(words),
      answerDuration: durationSeconds,
    };

    return this._metricsRepository.create(metrics);
  }

  private _computeWPM(wordCount: number, durationSeconds: number): number {
    if (durationSeconds === 0) return 0;
    return Math.round((wordCount / durationSeconds) * 60);
  }

  private _countFillerWords(words: string[]): number {
    return words.filter(w => FILLER_WORDS.includes(w.toLowerCase())).length;
  }

  private _computeVocabularyRichness(words: string[]): number {
    if (words.length === 0) return 0;
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    return parseFloat((uniqueWords.size / words.length).toFixed(3));
  }

  private _tokenize(transcript: string): string[] {
    return transcript
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(Boolean);
  }
}
```

**`FILLER_WORDS` constant:**
```typescript
// modules/metrics/constants/filler-words.constant.ts
export const FILLER_WORDS = [
  'um', 'uh', 'er', 'ah', 'like', 'you know', 'so', 'basically',
  'literally', 'actually', 'honestly', 'right', 'okay so',
];
```

### 8.3 Metrics Utilities (Pure Functions)

The computation algorithms are pure functions in `modules/metrics/utils/`:

```typescript
// modules/metrics/utils/speech.utils.ts
export function computeWordsPerMinute(wordCount: number, durationSeconds: number): number { ... }
export function extractFillerWords(transcript: string, fillerList: string[]): string[] { ... }
export function computeVocabularyRichness(words: string[]): number { ... }
export function detectRepeatedWords(words: string[], windowSize: number): string[] { ... }
```

**Why pure functions:**  
Pure functions (no side effects, same output for same input) are trivially unit testable. `expect(computeWordsPerMinute(100, 60)).toBe(100)`. No mocking, no DI, no infrastructure.

### 8.4 Metrics Flow

```
Answer submitted with transcript + durationSeconds
  ↓
MetricsService.compute(answerId, transcript, durationSeconds)
  ↓
  ├─ tokenize(transcript) → words[]
  ├─ computeWPM(words.length, duration) → Number
  ├─ countFillerWords(words, FILLER_WORDS) → Number + String[]
  ├─ countRepeatedWords(words) → Number + String[]
  └─ computeVocabularyRichness(words) → Number (0–1)
  ↓
MetricsRepository.create(metrics) → Stored in interview_metrics
  ↓
(Parallel, independently)
AIService.evaluateAnswer(question, transcript, profileSummary)
  ↓
AiEvaluationRepository.create(evaluation) → Stored in ai_evaluations
  ↓
Both results returned to client
```

---

## 9. Authentication Flow

### 9.1 Registration Flow

```
POST /auth/register
  Body: { name, email, password }
  ↓
ValidationPipe (CreateUserDto)
  @IsString() name
  @IsEmail() email
  @IsStrongPassword() password
  ↓
RateLimitGuard (5 registrations / hour / IP)
  ↓
AuthService.register()
  → Check if email exists → throw DUPLICATE_EMAIL if yes
  → Hash password with bcrypt (rounds: 12)
  → Create user document
  → Return { message: 'REGISTRATION_SUCCESS' }
```

### 9.2 Login Flow

```
POST /auth/login
  Body: { email, password }
  ↓
ValidationPipe (LoginDto)
  ↓
RateLimitGuard (10 attempts / 15min / email)
  ↓
AuthService.login()
  → Find user by email
  → Compare password hash → throw INVALID_CREDENTIALS if mismatch
  → Create session document:
      { userId, accessTokenHash: SHA256(accessToken), refreshTokenHash: SHA256(refreshToken) }
  → Return { accessToken, refreshToken, user }
```

### 9.3 Token Refresh Flow

```
POST /auth/refresh
  Body: { refreshToken }
  ↓
AuthService.refreshTokens()
  → Hash the received refreshToken
  → Find session by refreshTokenHash
  → Verify session is active and not expired
  → Revoke old session (isActive: false, revokedAt: now)
  → Create new session with new token pair
  → Return { accessToken, refreshToken }
```

### 9.4 Authenticated Request Flow

```
GET /interviews (or any protected route)
  ↓
AuthInterceptor (Angular) attaches Bearer token
  ↓
JwtAuthGuard (NestJS)
  → Extract token from Authorization header
  → Verify JWT signature → throw INVALID_TOKEN if invalid
  → Decode payload: { sub: userId, sessionId }
  → Find session by sessionId
  → Verify session.isActive → throw SESSION_REVOKED if false
  → Verify session not expired → throw SESSION_EXPIRED if true
  → Attach user payload to request.user
  ↓
Controller method executes
```

### 9.5 Frontend Authentication State

```typescript
// core/auth/auth.store.ts
@Injectable({ providedIn: 'root' })
export class AuthStore extends BaseStore<AuthState> {
  readonly currentUser = computed(() => this.state().user);
  readonly isAuthenticated = computed(() => !!this.state().user);
  readonly isLoading = computed(() => this.state().loading);

  constructor(
    private readonly _authApiService: AuthApiService,
    private readonly _tokenService: TokenService,
    private readonly _router: Router,
  ) {
    super({ user: null, loading: false, error: null });
    this._initFromStorage(); // Restore session on page reload
  }

  async login(credentials: LoginDto): Promise<void> {
    this.setState({ loading: true });
    try {
      const response = await firstValueFrom(this._authApiService.login(credentials));
      this._tokenService.setTokens(response.data.accessToken, response.data.refreshToken);
      this.setState({ user: response.data.user, loading: false });
      this._router.navigate(['/']);
    } catch (error) {
      this.setState({ error: error.message, loading: false });
    }
  }

  logout(): void {
    this._tokenService.clearTokens();
    this.setState({ user: null });
    this._router.navigate(['/auth/login']);
  }

  private _initFromStorage(): void {
    const token = this._tokenService.getAccessToken();
    if (token) {
      // Decode JWT to get user info without a server call
      const payload = this._tokenService.decodeToken(token);
      if (payload && !this._tokenService.isExpired(token)) {
        // Optionally fetch fresh user data
        this._fetchCurrentUser(payload.sub);
      }
    }
  }
}
```

---

## 10. Complete Folder Trees

### 10.1 Backend Folder Tree

```
backend/
├── Dockerfile
├── package.json
├── tsconfig.json
├── .env
├── .env.prod
│
└── src/
    ├── main.ts                          ← Entry point: Fastify, Pino, Swagger, Validation
    ├── app.module.ts                    ← Root module assembly
    ├── app.controller.ts                ← Health check: GET /health
    │
    ├── config/
    │   ├── configuration.ts             ← Config factory + Config interface
    │   ├── environment.ts               ← Development environment values
    │   └── environment.prod.ts          ← Production environment values
    │
    ├── core/
    │   ├── core.module.ts               ← @Global() module
    │   │
    │   ├── alerting/
    │   │   ├── alerting.interface.ts    ← IAlertingService interface
    │   │   ├── console-alerting.service.ts
    │   │   └── index.ts
    │   │
    │   ├── constants/
    │   │   └── mongo-operators.constant.ts
    │   │
    │   ├── decorators/
    │   │   ├── current-user.decorator.ts       ← @CurrentUser()
    │   │   ├── current-session.decorator.ts    ← @CurrentSession()
    │   │   ├── check-auth.decorator.ts         ← @CheckAuth() compound decorator
    │   │   ├── rate-limit.decorator.ts         ← @RateLimit()
    │   │   └── index.ts
    │   │
    │   ├── exceptions/
    │   │   ├── app.exception.ts
    │   │   ├── core.errors.ts
    │   │   ├── global-exception.filter.ts
    │   │   └── index.ts
    │   │
    │   ├── guards/
    │   │   ├── jwt-auth.guard.ts
    │   │   ├── rate-limit.guard.ts
    │   │   ├── ownership.guard.ts               ← Resource ownership check
    │   │   └── index.ts
    │   │
    │   ├── interceptors/
    │   │   ├── logging.interceptor.ts
    │   │   ├── response-wrapper.interceptor.ts  ← Wraps success responses in ApiResponse<T>
    │   │   ├── request-id.interceptor.ts        ← Attaches requestId to context
    │   │   └── index.ts
    │   │
    │   ├── models/
    │   │   ├── base.model.ts                    ← Abstract: deletedAt, timestamps
    │   │   └── index.ts
    │   │
    │   ├── pipes/
    │   │   ├── query-parser.pipe.ts
    │   │   └── index.ts
    │   │
    │   ├── repository/
    │   │   ├── base.repository.ts               ← BaseRepository<T>
    │   │   ├── query.service.ts                 ← Applies QueryConfig to Mongoose queries
    │   │   ├── query-config.types.ts            ← QueryConfig<T>, PaginatedResult<T>
    │   │   └── index.ts
    │   │
    │   ├── services/
    │   │   ├── rate-limit.service.ts
    │   │   └── index.ts
    │   │
    │   ├── tokens/
    │   │   ├── ownership-service.token.ts
    │   │   └── index.ts
    │   │
    │   ├── types/
    │   │   ├── api-response.type.ts             ← ApiResponse<T>, PaginatedApiResponse<T>
    │   │   └── index.ts
    │   │
    │   └── utils/
    │       ├── date.utils.ts
    │       ├── string.utils.ts
    │       ├── mongo.utils.ts
    │       ├── validation.utils.ts
    │       └── index.ts
    │
    ├── modules/
    │   │
    │   ├── auth/
    │   │   ├── auth.module.ts
    │   │   ├── auth.errors.ts
    │   │   ├── auth.enums.ts
    │   │   ├── controllers/
    │   │   │   └── auth.controller.ts
    │   │   ├── repositories/
    │   │   │   ├── user-session.repository.ts
    │   │   │   └── user-token.repository.ts
    │   │   ├── schemas/
    │   │   │   ├── user-session.schema.ts
    │   │   │   └── user-token.schema.ts          ← (Password reset tokens)
    │   │   ├── services/
    │   │   │   ├── auth.service.ts               ← login, register, logout, refresh
    │   │   │   ├── session.service.ts            ← Session CRUD
    │   │   │   └── password.service.ts           ← Hash, validate, reset
    │   │   └── dtos/
    │   │       ├── login.dto.ts
    │   │       ├── register.dto.ts
    │   │       └── refresh-token.dto.ts
    │   │
    │   ├── users/
    │   │   ├── users.module.ts
    │   │   ├── users.errors.ts
    │   │   ├── controllers/
    │   │   │   └── users.controller.ts
    │   │   ├── repositories/
    │   │   │   └── users.repository.ts
    │   │   ├── schemas/
    │   │   │   └── user.schema.ts
    │   │   ├── services/
    │   │   │   └── users.service.ts
    │   │   └── dtos/
    │   │       └── update-user.dto.ts
    │   │
    │   ├── candidate-profile/
    │   │   ├── candidate-profile.module.ts
    │   │   ├── candidate-profile.errors.ts
    │   │   ├── controllers/
    │   │   │   └── candidate-profile.controller.ts
    │   │   ├── repositories/
    │   │   │   └── candidate-profile.repository.ts
    │   │   ├── schemas/
    │   │   │   └── candidate-profile.schema.ts
    │   │   ├── services/
    │   │   │   └── candidate-profile.service.ts
    │   │   └── dtos/
    │   │       └── update-profile.dto.ts
    │   │
    │   ├── cv/
    │   │   ├── cv.module.ts
    │   │   ├── cv.errors.ts
    │   │   ├── controllers/
    │   │   │   └── cv.controller.ts              ← Multipart file upload
    │   │   ├── services/
    │   │   │   ├── cv.service.ts                 ← Orchestrates upload + analysis
    │   │   │   └── cv-parser.service.ts          ← Text extraction from PDF/DOCX
    │   │   └── dtos/
    │   │       └── upload-cv.dto.ts
    │   │
    │   ├── interview/
    │   │   ├── interview.module.ts
    │   │   ├── interview.errors.ts
    │   │   ├── interview.enums.ts                ← InterviewMode, InterviewStatus
    │   │   ├── controllers/
    │   │   │   └── interview.controller.ts
    │   │   ├── repositories/
    │   │   │   └── interview.repository.ts
    │   │   ├── schemas/
    │   │   │   └── interview.schema.ts
    │   │   ├── services/
    │   │   │   └── interview.service.ts
    │   │   ├── projections/
    │   │   │   └── interview.projection.ts
    │   │   └── dtos/
    │   │       ├── create-interview.dto.ts
    │   │       └── complete-interview.dto.ts
    │   │
    │   ├── question/
    │   │   ├── question.module.ts
    │   │   ├── question.errors.ts
    │   │   ├── question.enums.ts                 ← QuestionType, QuestionDifficulty
    │   │   ├── controllers/
    │   │   │   └── question.controller.ts
    │   │   ├── repositories/
    │   │   │   └── question.repository.ts
    │   │   ├── schemas/
    │   │   │   └── question.schema.ts
    │   │   ├── services/
    │   │   │   └── question.service.ts
    │   │   └── dtos/
    │   │       └── generate-questions.dto.ts
    │   │
    │   ├── answer/
    │   │   ├── answer.module.ts
    │   │   ├── answer.errors.ts
    │   │   ├── controllers/
    │   │   │   └── answer.controller.ts
    │   │   ├── repositories/
    │   │   │   └── answer.repository.ts
    │   │   ├── schemas/
    │   │   │   └── answer.schema.ts
    │   │   ├── services/
    │   │   │   └── answer.service.ts             ← Orchestrates metrics + AI evaluation
    │   │   └── dtos/
    │   │       └── submit-answer.dto.ts
    │   │
    │   ├── metrics/
    │   │   ├── metrics.module.ts
    │   │   ├── metrics.errors.ts
    │   │   ├── controllers/
    │   │   │   └── metrics.controller.ts         ← GET /answers/:id/metrics
    │   │   ├── repositories/
    │   │   │   └── metrics.repository.ts
    │   │   ├── schemas/
    │   │   │   └── interview-metrics.schema.ts
    │   │   ├── services/
    │   │   │   └── metrics.service.ts            ← Pure computation, no AI
    │   │   ├── constants/
    │   │   │   └── filler-words.constant.ts
    │   │   └── utils/
    │   │       └── speech.utils.ts               ← Pure computation functions
    │   │
    │   ├── ai/
    │   │   ├── ai.module.ts
    │   │   ├── ai.errors.ts
    │   │   ├── interfaces/
    │   │   │   ├── ai-provider.interface.ts      ← IAIProvider
    │   │   │   └── ai-results.interface.ts       ← CvAnalysisResult, etc.
    │   │   ├── providers/
    │   │   │   └── gemini.provider.ts            ← Gemini SDK implementation
    │   │   ├── prompts/
    │   │   │   ├── cv-analysis.prompt.ts         ← Prompt template functions
    │   │   │   ├── question-generation.prompt.ts
    │   │   │   └── answer-evaluation.prompt.ts
    │   │   ├── repositories/
    │   │   │   └── ai-evaluation.repository.ts
    │   │   ├── schemas/
    │   │   │   └── ai-evaluation.schema.ts
    │   │   └── services/
    │   │       └── ai.service.ts                 ← Public facade, injects IAIProvider
    │   │
    │   ├── storage/
    │   │   ├── storage.module.ts
    │   │   ├── interfaces/
    │   │   │   └── storage-provider.interface.ts ← IStorageProvider
    │   │   ├── providers/
    │   │   │   ├── local-storage.provider.ts
    │   │   │   └── s3-storage.provider.ts
    │   │   └── services/
    │   │       └── storage.service.ts
    │   │
    │   ├── notification/
    │   │   ├── notification.module.ts
    │   │   ├── notification.enums.ts
    │   │   ├── controllers/
    │   │   │   └── notification.controller.ts
    │   │   ├── repositories/
    │   │   │   └── notification.repository.ts
    │   │   ├── schemas/
    │   │   │   └── notification.schema.ts
    │   │   └── services/
    │   │       └── notification.service.ts
    │   │
    │   └── settings/
    │       ├── settings.module.ts
    │       ├── controllers/
    │       │   └── settings.controller.ts
    │       ├── repositories/
    │       │   └── settings.repository.ts
    │       ├── schemas/
    │       │   └── user-settings.schema.ts
    │       ├── services/
    │       │   └── settings.service.ts
    │       └── dtos/
    │           └── update-settings.dto.ts
    │
    └── shared/
        └── constants/
            └── app.constants.ts               ← Global constants (interview modes, etc.)
```

---

### 10.2 Frontend Folder Tree

```
frontend/
├── angular.json
├── package.json
├── tsconfig.json
├── tailwind.config.ts
│
└── src/
    ├── main.ts
    ├── index.html
    ├── styles.scss                      ← Global styles entry point
    │
    ├── environments/
    │   ├── environment.ts
    │   └── environment.prod.ts
    │
    └── app/
        ├── app.component.ts             ← Root component (RouterOutlet only)
        ├── app.config.ts                ← Angular providers: HttpClient, Router, Material, i18n
        ├── app.routes.ts                ← Root lazy-load routes
        │
        ├── layout/
        │   ├── main-layout.component.ts ← Shell: sidebar + content area
        │   ├── sidebar.component.ts     ← Navigation sidebar
        │   ├── header.component.ts      ← Top bar with user menu
        │   └── auth-layout.component.ts ← Centered layout for auth pages
        │
        ├── core/
        │   ├── auth/
        │   │   ├── auth.store.ts        ← Signal store: currentUser, isAuthenticated
        │   │   ├── auth.service.ts      ← Login/logout/register API calls
        │   │   ├── token.service.ts     ← JWT storage and decoding
        │   │   ├── jwt-auth.guard.ts    ← Functional guard: redirect to /auth/login
        │   │   └── no-auth.guard.ts     ← Functional guard: redirect away from /auth
        │   │
        │   ├── http/
        │   │   ├── base-api.service.ts  ← BaseApiService<T>
        │   │   ├── auth.interceptor.ts  ← Attaches Bearer token
        │   │   ├── token-refresh.interceptor.ts  ← Handles 401
        │   │   ├── error.interceptor.ts ← Maps error codes to messages
        │   │   └── loading.interceptor.ts
        │   │
        │   ├── models/
        │   │   ├── user.model.ts
        │   │   ├── interview.model.ts
        │   │   ├── question.model.ts
        │   │   ├── answer.model.ts
        │   │   ├── metrics.model.ts
        │   │   ├── candidate-profile.model.ts
        │   │   └── notification.model.ts
        │   │
        │   ├── speech/
        │   │   ├── audio-recorder.service.ts
        │   │   ├── speech-recognition.service.ts
        │   │   ├── transcript-validation.service.ts
        │   │   └── audio-upload.service.ts
        │   │
        │   ├── store/
        │   │   ├── base.store.ts        ← BaseStore<TState>
        │   │   ├── list.store.ts        ← ListStore<T>
        │   │   └── active-interview.store.ts  ← Global: active session state
        │   │
        │   ├── notification/
        │   │   └── notification.service.ts    ← Angular Material Snackbar wrapper
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
        │   │   │   └── waveform.component.ts
        │   │   ├── score-gauge/
        │   │   │   └── score-gauge.component.ts
        │   │   ├── metrics-chart/
        │   │   │   └── metrics-chart.component.ts
        │   │   ├── base-table/
        │   │   │   └── base-table.component.ts
        │   │   ├── empty-state/
        │   │   │   └── empty-state.component.ts
        │   │   ├── loading-spinner/
        │   │   │   └── loading-spinner.component.ts
        │   │   ├── confirm-dialog/
        │   │   │   └── confirm-dialog.component.ts
        │   │   └── card/
        │   │       └── card.component.ts
        │   │
        │   ├── directives/
        │   │   ├── auto-focus.directive.ts
        │   │   ├── click-outside.directive.ts
        │   │   └── resize-observer.directive.ts
        │   │
        │   ├── pipes/
        │   │   ├── duration.pipe.ts
        │   │   ├── score.pipe.ts
        │   │   ├── relative-date.pipe.ts
        │   │   └── filler-highlight.pipe.ts
        │   │
        │   └── validators/
        │       ├── password-strength.validator.ts
        │       └── match-field.validator.ts
        │
        └── features/
            │
            ├── auth/
            │   ├── auth.routes.ts
            │   └── pages/
            │       ├── login/
            │       │   └── login.page.ts
            │       ├── register/
            │       │   └── register.page.ts
            │       └── forgot-password/
            │           └── forgot-password.page.ts
            │
            ├── dashboard/
            │   ├── dashboard.routes.ts
            │   └── pages/
            │       └── dashboard/
            │           ├── dashboard.page.ts
            │           └── dashboard.store.ts
            │
            ├── profile/
            │   ├── profile.routes.ts
            │   ├── pages/
            │   │   └── profile/
            │   │       ├── profile.page.ts
            │   │       └── profile.store.ts
            │   ├── components/
            │   │   ├── cv-upload/
            │   │   │   └── cv-upload.component.ts
            │   │   ├── skills-display/
            │   │   │   └── skills-display.component.ts
            │   │   └── experience-list/
            │   │       └── experience-list.component.ts
            │   └── services/
            │       └── profile.api.service.ts
            │
            ├── interview/
            │   ├── interview.routes.ts
            │   ├── pages/
            │   │   ├── interview-setup/
            │   │   │   ├── interview-setup.page.ts  ← Choose mode, start session
            │   │   │   └── interview-setup.store.ts
            │   │   ├── interview-session/
            │   │   │   ├── interview-session.page.ts  ← Active session UI
            │   │   │   └── interview-session.store.ts
            │   │   └── interview-results/
            │   │       ├── interview-results.page.ts  ← Post-session summary
            │   │       └── interview-results.store.ts
            │   ├── components/
            │   │   ├── question-display/
            │   │   │   └── question-display.component.ts
            │   │   ├── transcript-display/
            │   │   │   └── transcript-display.component.ts
            │   │   ├── session-timer/
            │   │   │   └── session-timer.component.ts
            │   │   ├── answer-actions/
            │   │   │   └── answer-actions.component.ts
            │   │   └── metrics-summary/
            │   │       └── metrics-summary.component.ts
            │   └── services/
            │       └── interview.api.service.ts
            │
            ├── history/
            │   ├── history.routes.ts
            │   ├── pages/
            │   │   ├── history-list/
            │   │   │   ├── history-list.page.ts
            │   │   │   └── history-list.store.ts
            │   │   └── session-detail/
            │   │       ├── session-detail.page.ts
            │   │       └── session-detail.store.ts
            │   ├── components/
            │   │   └── session-card/
            │   │       └── session-card.component.ts
            │   └── services/
            │       └── history.api.service.ts
            │
            ├── analytics/
            │   ├── analytics.routes.ts
            │   ├── pages/
            │   │   └── analytics/
            │   │       ├── analytics.page.ts
            │   │       └── analytics.store.ts
            │   ├── components/
            │   │   ├── progress-chart/
            │   │   │   └── progress-chart.component.ts
            │   │   ├── skill-radar/
            │   │   │   └── skill-radar.component.ts
            │   │   └── metric-trend/
            │   │       └── metric-trend.component.ts
            │   └── services/
            │       └── analytics.api.service.ts
            │
            └── settings/
                ├── settings.routes.ts
                ├── pages/
                │   └── settings/
                │       ├── settings.page.ts
                │       └── settings.store.ts
                └── services/
                    └── settings.api.service.ts
```

---

## 11. Data Flow Diagrams

### 11.1 Interview Flow (End-to-End)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  1. SETUP                                                                │
│                                                                          │
│  User selects mode (HR/Technical/Mixed) and clicks "Start Interview"     │
│  → InterviewSetupPage → InterviewApiService.create({ mode })             │
│  ← Backend: InterviewService.createSession()                            │
│      → Fetch candidate profile (skills, summary)                        │
│      → AIService.generateQuestions(profile, mode, 10)                   │
│      → Store questions in database                                       │
│      → Return { interview, questions }                                   │
│  → Frontend navigates to /interview/:id/session                         │
└────────────────────────────────────────────────────────────────────────┬─┘
                                                                         │
┌────────────────────────────────────────────────────────────────────────▼─┐
│  2. ACTIVE SESSION                                                       │
│                                                                          │
│  InterviewSessionPage displays Question 1                                │
│  User clicks "Start Recording"                                           │
│  → AudioRecorderService.startRecording()   ← MediaRecorder API         │
│  → SpeechRecognitionService.start()        ← Web Speech API             │
│                                                                          │
│  Real-time updates:                                                      │
│  → SpeechRecognitionService.interimTranscript() → TranscriptDisplay     │
│  → AudioRecorderService audio stream → WaveformComponent                │
│                                                                          │
│  User clicks "Stop Recording"                                            │
│  → finalTranscript: string                                              │
│  → audioBlob: Blob                                                       │
│  → TranscriptValidationService.validate()  → check min length           │
│                                                                          │
│  User clicks "Submit Answer"                                             │
│  → InterviewApiService.submitAnswer({ transcript, audioBlob })          │
│  ← Backend: AnswerService.submit()                                      │
│      → StorageService.store(audioBlob)   → audioUrl                    │
│      → AnswerRepository.create()                                        │
│      → MetricsService.compute()          ← DETERMINISTIC               │
│      → AIService.evaluateAnswer()        ← GENERATIVE                  │
│  ← Return { answer, metrics, evaluation }                               │
│                                                                          │
│  Frontend advances to Question 2 ... (repeat for all questions)         │
└────────────────────────────────────────────────────────────────────────┬─┘
                                                                         │
┌────────────────────────────────────────────────────────────────────────▼─┐
│  3. SESSION COMPLETION                                                   │
│                                                                          │
│  After last answer submitted:                                            │
│  → InterviewApiService.completeSession(interviewId)                     │
│  ← Backend: InterviewService.completeSession()                          │
│      → Compute aggregate scores (avg of per-answer scores)              │
│      → AIService.generateSessionSummary()  ← overall AI feedback       │
│      → Update interview document with scores + aiFeedback              │
│      → NotificationService.create(userId, 'SESSION_COMPLETE')           │
│  ← Return completed Interview with scores                               │
│  → Frontend navigates to /interview/:id/results                         │
└──────────────────────────────────────────────────────────────────────────┘
```

### 11.2 CV Upload and Analysis Flow

```
User clicks "Upload CV" and selects file
  ↓
ProfilePage → CvUploadComponent
  → Validate file (type: PDF/DOCX, size: max 5MB)
  → ProfileApiService.uploadCv(file)
    → multipart/form-data POST /cv/upload
  ↓
Backend: CvController (multipart guard)
  → CvService.processUpload(userId, file)
      → StorageService.store(file) → cvUrl
      → CvParserService.extractText(file) → rawText
      → CandidateProfileRepository.upsert(userId, {
          cvUrl, cvFileName, analysisStatus: 'PENDING'
        })
      → [async] AIService.analyzeCv(rawText)
          → GeminiProvider → Gemini API
          → Returns CvAnalysisResult
      → CandidateProfileRepository.update(userId, {
          summary, skills, technologies, experience, projects,
          strengths, weaknesses, analysisStatus: 'COMPLETED'
        })
      → NotificationService.create(userId, 'CV_ANALYZED')
  ← Return { message: 'CV_UPLOAD_SUCCESS', analysisStatus: 'PENDING' }
  ↓
Frontend polls GET /candidate-profile (or uses SSE in v2)
  → Shows analysis status indicator
  → When COMPLETED: displays profile data
```

---

## 12. State Management Strategy

### 12.1 State Layers

| Layer | Store | Scope | Technology |
|---|---|---|---|
| Global Auth State | `AuthStore` | App-wide | `BaseStore<AuthState>` signals |
| Active Interview State | `ActiveInterviewStore` | App-wide (while session active) | `BaseStore<InterviewState>` signals |
| Dashboard State | `DashboardStore` | Page | `BaseStore<DashboardState>` signals |
| History List State | `HistoryListStore` | Page | `ListStore<Interview>` signals |
| Profile State | `ProfileStore` | Page | `BaseStore<ProfileState>` signals |
| Analytics State | `AnalyticsStore` | Page | `BaseStore<AnalyticsState>` signals |
| Settings State | `SettingsStore` | Page | `BaseStore<SettingsState>` signals |

### 12.2 Signal-Based Unidirectional Flow

```
User Action (click / voice input)
  ↓
Smart Component (Page) calls Store method
  ↓
Store method calls API Service
  ↓
API Service returns Observable → firstValueFrom()
  ↓
Store updates state signal: this.setState({ ... })
  ↓
Computed signals automatically recalculate
  ↓
Template re-renders only changed parts (OnPush + signals)
```

**This is strictly unidirectional. Dumb components never touch stores.**

### 12.3 `ListStore<T>` (Pagination Pattern)

```typescript
// core/store/list.store.ts
export class ListStore<T> extends BaseStore<ListState<T>> {
  readonly entities = computed(() => this.state().entities);
  readonly totalCount = computed(() => this.state().totalCount);
  readonly currentPage = computed(() => this.state().currentPage);
  readonly pageSize = computed(() => this.state().pageSize);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);
  readonly totalPages = computed(() =>
    Math.ceil(this.state().totalCount / this.state().pageSize)
  );

  setPage(page: number): void {
    this.setState({ currentPage: page });
  }

  setEntities(entities: T[], totalCount: number): void {
    this.setState({ entities, totalCount, loading: false });
  }
}
```

Feature-specific stores extend it:
```typescript
// features/history/pages/history-list/history-list.store.ts
@Injectable()
export class HistoryListStore extends ListStore<Interview> {
  constructor(private readonly _historyApiService: HistoryApiService) {
    super({ entities: [], totalCount: 0, currentPage: 1, pageSize: 10, loading: false, error: null });
  }

  async loadPage(page: number = 1): Promise<void> {
    this.setState({ loading: true, currentPage: page });
    try {
      const response = await firstValueFrom(
        this._historyApiService.findAll(new HttpParams().set('page', page).set('limit', 10))
      );
      this.setEntities(response.data, response.pagination.total);
    } catch (error) {
      this.setState({ error: error.message, loading: false });
    }
  }
}
```

### 12.4 Global vs. Page Store Decision Rule

**Use a global store (in `core/store/`) when:**
- The state is needed by more than one feature simultaneously (e.g., current user, active interview session).
- The state must persist across navigation.

**Use a page-level store (in the feature's `pages/` folder) when:**
- The state belongs to a single page's lifecycle.
- It should reset when the user navigates away.

**Never use global stores for:**
- Form state (use Angular reactive forms).
- Component-specific UI state (use component-level signals).

---

## 13. Module Communication Rules

### 13.1 Backend Module Communication

```
Rule 1: A module may only access another module's data through the 
        other module's exported SERVICE, never its repository or schema directly.

Rule 2: Cross-module imports are declared in the importing module's `imports` array.
        The exporting module declares its services in its `exports` array.

Rule 3: The AI module is imported by: cv, interview, answer.
        The AI module itself imports NO business module.
        (It depends only on core infrastructure.)

Rule 4: The metrics module imports NO AI module.
        The answer module imports BOTH metrics and AI.
        The answer service orchestrates: run metrics → run AI → save both.
        Metrics and AI are parallel concerns, not sequential dependencies.

Rule 5: No circular dependencies. If two modules need each other,
        extract the shared concern into a third module.
```

### 13.2 Frontend Module Communication

```
Rule 1: Features communicate only through the router (navigation).
        Feature A does not import Feature B's components.

Rule 2: Features may import from shared/ and core/.
        shared/ and core/ never import from features/.

Rule 3: Smart components (pages) communicate with child dumb components 
        via @Input() and @Output() only. Never pass stores to dumb components.

Rule 4: Global stores (AuthStore, ActiveInterviewStore) are injected
        via Angular DI. They are NOT passed as inputs to components.

Rule 5: API services live in the feature that owns the domain.
        Shared models live in core/models/.
```

---

## 14. Design Patterns Used

### Backend

| Pattern | Location | Purpose |
|---|---|---|
| Repository Pattern | `core/repository/`, `modules/*/repositories/` | Encapsulates MongoDB queries; enables mocking for tests |
| Provider / Adapter Pattern | `modules/ai/providers/`, `modules/storage/providers/` | External vendor isolation; swappable implementations |
| Template Method Pattern | `BaseRepository<T>` soft-delete filter | Invariant behavior (never expose deleted records) that subclasses cannot bypass |
| Facade Pattern | `AIService` | Public interface over `IAIProvider`; no consumer knows which provider is active |
| Decorator Pattern | `@CheckAuth()`, `@CurrentUser()`, `@RateLimit()` | `applyDecorators()` combining `SetMetadata` + `UseGuards` |
| Strategy Pattern | `IAlertingService` (console vs. webhook) | Pluggable alerting without changing the exception filter |
| Value Object Pattern | `*.errors.ts` files | Immutable error definitions: `{ message, statusCode }` |
| Injection Token Pattern | `AI_PROVIDER_TOKEN`, `OWNERSHIP_SERVICE_TOKEN` | Decouples guard from concrete class; same guard reusable across modules |
| Observer Pattern | NestJS event emitter (future) | Post-answer processing notifications across modules |
| Builder Pattern | `QueryService.buildQuery()` | Incrementally applies filter, sort, pagination, populate to a Mongoose query |

### Frontend

| Pattern | Location | Purpose |
|---|---|---|
| Smart / Dumb Component Pattern | All features | Smart pages own data; dumb components render it |
| Signal-Based Unidirectional Flow | All stores | Predictable state updates; no two-way binding on stores |
| Base Class Pattern | `BaseStore<T>`, `ListStore<T>`, `BaseApiService<T>` | Eliminate boilerplate; enforce consistent behavior |
| Observer Pattern | RxJS `Observable`, Angular signals | Reactive data flow from API to template |
| Interceptor Chain | HTTP interceptors | Auth → Refresh → Error → Loading, without coupling any to each other |
| Lazy Loading Pattern | Route-level `loadChildren` | Load code only when needed; fast initial bundle |
| Factory Pattern | `app.config.ts` providers | Configure services at bootstrap time via factory functions |

---

## 15. Architecture Rules

### Backend Rules

**Controller Layer**
1. Controllers never access repositories directly.
2. Controller methods have at most one service call.
3. All authorization is declared via decorators at the controller method level.
4. Admin and user endpoints exist in the same controller file, protected by different auth decorators.
5. No business logic in controllers. No conditional branching based on business rules.

**Service Layer**
6. Services orchestrate repositories and other services.
7. Services never call Mongoose model methods directly.
8. Cross-module data access goes through exported services, never through a directly imported repository.
9. All AI calls go through `AIService`, never directly to `GeminiProvider`.
10. Metrics computation is always deterministic. `MetricsService` never calls `AIService`.

**Repository Layer**
11. All Mongoose query construction lives in repositories.
12. Soft-delete is automatic. All queries from `BaseRepository` exclude soft-deleted records by default.
13. Hard deletes do not exist for user-facing data in InterviewLab.

**Schema Rules**
14. Every domain schema extends `BaseModel` (gaining `deletedAt`, timestamps).
15. Schemas are registered per-module. No schema is shared globally.
16. Sensitive fields have `select: false` (e.g., `passwordHash`).

**Error Handling Rules**
17. All thrown exceptions use `AppException.throw(ERROR_CONSTANT)`.
18. Error definitions are plain objects in `{module}.errors.ts` files.
19. Error messages are machine codes (SCREAMING_SNAKE_CASE), not sentences.
20. 5xx errors trigger alerting. 4xx errors are warnings only.

**AI Rules**
21. Only `AIService` imports `IAIProvider`. No other module references the Gemini SDK.
22. AI prompts are defined in `modules/ai/prompts/` as template functions, not inline strings.
23. AI responses are parsed and validated before being stored. Malformed AI output throws `AI_ERRORS.PARSE_FAILED`.

**Configuration Rules**
24. No hardcoded configuration values in service code. All environment values come from `ConfigService`.
25. The application refuses to start if required secrets are missing.

### Frontend Rules

**Component Rules**
26. Dumb components never inject stores. They receive data via `@Input()` and emit via `@Output()`.
27. Smart components (pages) inject stores and API services.
28. All components use `ChangeDetectionStrategy.OnPush`.
29. Component selectors use the `il-` prefix.

**State Rules**
30. State is updated only through store methods, never by direct signal assignment outside the store.
31. Observables are converted to signals at the store boundary. Templates consume signals only.
32. API responses are always unwrapped (`response.data`) before entering the store.

**Dependency Rules**
33. Features never import from other features.
34. `shared/` and `core/` never import from `features/`.
35. `core/` never imports from `shared/`.

**HTTP Rules**
36. Components never use `HttpClient` directly. They use API services.
37. All API services extend `BaseApiService<T>`.
38. All HTTP requests go through the interceptor chain.

---

## 16. Naming Conventions

### Backend

| Element | Convention | Example |
|---|---|---|
| Files | kebab-case + type suffix | `interview.service.ts`, `user.schema.ts` |
| Classes | PascalCase + type suffix | `InterviewService`, `InterviewRepository` |
| Interfaces | PascalCase (no `I` prefix except core ports) | `IAIProvider`, `IStorageProvider` |
| Methods | camelCase | `createSession()`, `findByUserId()` |
| Private methods | `_camelCase` | `_buildPrompt()`, `_computeWPM()` |
| Private properties | `_camelCase` | `this._repository`, `this._aiService` |
| Error constants | SCREAMING_SNAKE_CASE object | `INTERVIEW_ERRORS`, `AUTH_ERRORS` |
| Error message values | SCREAMING_SNAKE_CASE string | `'SESSION_NOT_FOUND'`, `'INVALID_TOKEN'` |
| Enum values | SCREAMING_SNAKE_CASE | `InterviewStatus.IN_PROGRESS` |
| Module folders | kebab-case | `candidate-profile/`, `ai/` |
| Constants files | `{module}.constants.ts` | `filler-words.constant.ts` |
| Prompt files | `{purpose}.prompt.ts` | `cv-analysis.prompt.ts` |

### Frontend

| Element | Convention | Example |
|---|---|---|
| Files | kebab-case + type suffix | `interview-session.page.ts`, `waveform.component.ts` |
| Classes | PascalCase + type suffix | `InterviewSessionPage`, `WaveformComponent` |
| Selectors | `il-` prefix + kebab-case | `il-waveform`, `il-score-gauge` |
| Signals | camelCase (no `$` suffix) | `isLoading`, `currentUser`, `entities` |
| Observables | camelCase + `$` suffix | `destroy$`, `resize$` |
| Store methods | verb + noun | `loadPage()`, `startSession()`, `resetState()` |
| Private members | `_camelCase` | `this._store`, `this._router` |
| API services | `{feature}.api.service.ts` | `interview.api.service.ts` |
| Page stores | `{page-name}.store.ts` | `history-list.store.ts` |

---

## 17. Dependency Diagrams

### 17.1 Backend Module Dependency Graph

```
                    ┌──────────────────┐
                    │   CoreModule     │ @Global()
                    │   (cross-cutting)│
                    └────────┬─────────┘
                             │ Available to all
          ┌──────────────────┼──────────────────────┐
          ▼                  ▼                       ▼
    ┌──────────┐      ┌──────────────┐       ┌────────────┐
    │   auth   │      │    users     │       │  storage   │
    └────┬─────┘      └──────┬───────┘       └─────┬──────┘
         │                   │                      │
         │ (exports users)   │                      │ (exports StorageService)
         ▼                   ▼                      │
    ┌────────────────────────┐                      │
    │   candidate-profile    │◄─────────────────────┘
    └────────────┬───────────┘
                 │ (exports CandidateProfileService)
                 ▼
         ┌───────────┐          ┌──────────────┐
         │    cv     │─────────►│    ai        │
         └───────────┘  imports └──────┬───────┘
                                       │ (exports AIService)
         ┌─────────────────────────────┘
         ▼
    ┌────────────┐          ┌──────────────┐
    │ interview  │─────────►│   question   │
    └─────┬──────┘  imports └──────────────┘
          │
          │ (exports InterviewService)
          ▼
    ┌──────────┐    ┌──────────────┐    ┌──────────────────┐
    │  answer  │───►│   metrics   │    │  ai (evaluation) │
    └──────────┘    └──────────────┘    └──────────────────┘
          │          (no AI import)       (imported by answer)
          │
          ▼
    ┌──────────────┐    ┌──────────────┐
    │ notification │    │   settings   │
    └──────────────┘    └──────────────┘
```

### 17.2 Frontend Dependency Graph

```
                ┌──────────────────────────┐
                │  @angular/* + @angular/  │  Tier 1: Platform
                │  material + rxjs + ngx-  │
                │  translate + chart.js    │
                └─────────────┬────────────┘
                              │
                ┌─────────────▼────────────┐
                │         core/            │  Tier 2: Infrastructure
                │  auth · http · store ·   │
                │  speech · models · utils │
                └─────────────┬────────────┘
                              │
                ┌─────────────▼────────────┐
                │         shared/          │  Tier 3: UI Primitives
                │  components · directives │
                │  pipes · validators      │
                └─────────────┬────────────┘
                              │
         ┌────────────────────┼──────────────────────┐
         ▼                    ▼                       ▼
  ┌────────────┐     ┌────────────────┐      ┌────────────────┐
  │    auth    │     │   interview    │      │   analytics    │
  │  feature   │     │    feature     │      │    feature     │
  └────────────┘     └────────────────┘      └────────────────┘
         ▼                    ▼                       ▼
  ┌────────────┐     ┌────────────────┐      ┌────────────────┐
  │ dashboard  │     │    history     │      │   settings     │
  │  feature   │     │    feature     │      │    feature     │
  └────────────┘     └────────────────┘      └────────────────┘

  Rule: Arrows only point DOWN. No upward or lateral imports between features.
```

---

## APPENDIX: Open-Source Replacements Summary

| Removed (Company-Specific) | Why Removed | InterviewLab Replacement | Decision Type |
|---|---|---|---|
| `@keenops/ng` SDK | Company npm package — no external applicability | Core abstractions in `src/app/core/` | D |
| `local-keenops` library | Multi-project library unnecessary for single app | Base classes in `core/store/` and `shared/components/` | D |
| `authUrlRewriteInterceptor` | Workaround for SDK URL assumptions — not needed | Standard `AuthInterceptor` | A |
| `yfa-*` component prefix | Branding | `il-*` prefix | D |
| `SlackNotificationService` | Company tool | `IAlertingService` interface + `ConsoleAlertingService` | D |
| `ClickUpChatService` | Company tool | Replaced by `IAlertingService` pattern | D |
| `PrimeNG` | Not in InterviewLab stack | Angular Material (specified in stack) | C |
| `BaseDAO<T>` naming | Java DAO convention | `BaseRepository<T>` (standard Node.js term) | D |
| `BaseCrudService` naming | Implies CRUD only | `BaseResourceService<T>` | D |
| Redis | Premature for v1.0 single-container | In-memory rate limiting (IRateLimitStore interface for future swap) | D |
| Stripe | Not in InterviewLab domain | Removed entirely | D |
| Firebase FCM | Not in InterviewLab domain | Removed entirely | D |
| SendGrid | Not in InterviewLab domain | Removed (email scope excluded from v1.0) | D |
| Google OAuth | Not in v1.0 scope | Removed (standard email/password only) | D |
| `forwardRef()` circular deps | Architectural smell | Resolved by proper module boundary design | Improvement |
| Missing response envelope | Inconsistent API responses | `ResponseWrapperInterceptor` + `ApiResponse<T>` type | Improvement |
| Guard-based field validation | Less expressive than class validators | Class-based DTOs + `class-validator` + `whitelist: true` | Improvement |
| Plain string logging | Hard to parse in log aggregators | Pino structured JSON logging via Fastify adapter | Improvement |
```
<parameter name="ArtifactMetadata">{"Summary": "Complete InterviewLab software architecture blueprint covering: backend NestJS architecture with module inventory, folder trees, controller/service/repository patterns, DTO validation strategy, auth flow, error handling, and Swagger config; frontend Angular architecture with 4-tier dependency layering, signal-based state management, smart/dumb component pattern, lazy loading, routing, HTTP interceptor chain, theme/i18n strategy; AI architecture with IAIProvider interface and GeminiProvider adapter; Speech architecture separating AudioRecorderService, SpeechRecognitionService, and TranscriptValidationService; Metrics Engine design with deterministic computation separate from AI evaluation; MongoDB database design with all collections, relationships, and indexes; complete folder trees for both backend and frontend; data flow diagrams for interview flow, CV upload flow, speech flow, and metrics flow; design pattern catalog; module communication rules; architecture rules; naming conventions; and a full table of open-source replacements for all company-specific abstractions.", "UserFacing": true, "RequestFeedback": false}
