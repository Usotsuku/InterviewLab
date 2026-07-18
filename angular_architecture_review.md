# Yalla-Farha v2 — Admin Angular Architecture Review

> **Audience**: Principal Frontend Engineers, Architectural Review Boards, and Senior Angular Developers.  
> **Scope**: Admin Panel Frontend (`/admin`). Business logic deliberately excluded.  
> **Stack**: Angular 21.2 · PrimeNG 21.1 · TailwindCSS 4.1 · RxJS 7.8 · NgIcons 27.5 · ngx-translate 15.0

---

## 1. Global Architecture Style

The Yalla-Farha v2 Admin frontend is designed as a **Corporate-Grade Workspace Monolith** built on **Angular Standalone Components (No NgModules)** and powered by **Angular Signals (v18+)** for reactive state propagation.

The architecture enforces a strict **4-Tier Dependency Layering System** that separates low-level infrastructural code from business domain features:

```
┌────────────────────────────────────────────────────────┐
│             Tier 4: Application Shell                  │
│             (projects/admin/src/app)                   │
└──────────────────────────┬─────────────────────────────┘
                           │ Imports from
┌──────────────────────────▼─────────────────────────────┐
│             Tier 3: Shared Domain Library              │
│             (admin/src/shared)                         │
└──────────────────────────┬─────────────────────────────┘
                           │ Imports from
┌──────────────────────────▼─────────────────────────────┐
│             Tier 2: Workspace Core Library             │
│             (projects/local-keenops)                   │
└──────────────────────────┬─────────────────────────────┘
                           │ Imports from
┌──────────────────────────▼─────────────────────────────┐
│             Tier 1: Enterprise SDK                     │
│             (@keenops/ng NPM packages)                 │
└────────────────────────────────────────────────────────┘
```

### The Architectural Tiers

1. **Tier 1: Enterprise SDK (`@keenops/ng`)**: A set of compiled npm packages that establish the boilerplate architecture. It provides authorization routines, security configurations, a generic Tailwind-based notification provider, and abstract state containers.
2. **Tier 2: Workspace Core Library (`projects/local-keenops`)**: A local workspace package that contains framework-agnostic base components. It defines abstract classes for row-editable tables (`AbstractTableWidget`), reactive forms (`AbstractForm`), dialog forms (`AbstractModalForm`), search/infinite-scroll dropdowns (`AbstractSelectWidget`), and caching data-access base services.
3. **Tier 3: Shared Domain Library (`admin/src/shared`)**: The domain heart of the workspace. Located outside the main application shell, it maps the Mongoose models, sets up data pipelines (`OccasionDataService`), and implements PrimeNG widgets (`OccasionTableWidget`).
4. **Tier 4: Application Shell (`projects/admin`)**: The orchestrator. It manages routes, page frameworks (layout grids/sidebars), translation assets, environment files, and bootstrap configurations.

---

## 2. Folder Structure Analysis

```
admin/
├── angular.json               ← Build configurations & styles mapping
├── package.json               ← Version 21 dependencies
├── tsconfig.json              ← Global aliases definition
│
├── projects/
│   ├── admin/                 ← Application Shell (App Layer)
│   │   └── src/
│   │       ├── app/           ← Frames, config, root routing
│   │       └── environments/  ← Env specific variables
│   │
│   └── local-keenops/         ← Workspace Core Library (Base Layer)
│       └── src/
│           ├── public-api.ts  ← Public exports interface
│           └── lib/           ← Abstract widgets and services
│
└── src/
    └── shared/                ← Shared Domain Library (Domain Layer)
        ├── models/            ← Model classes mapping Mongoose schema
        ├── services/          ← API/Data retrieval layer
        └── widgets/           ← Reusable domain components
```

### Detailed Folder Responsibilities

#### `projects/admin/src/app/frames/`
- **Why it exists**: Provides layout containers (frames) such as `main` (sidebar + content layout), `auth` (centered panel for auth views), `settings` (navigation for profile controls), and `error` (fallback page layouts).
- **Responsibilities**: Component structure representing layouts, sidebar navigation mappings, routing sub-configurations.
- **Never belongs here**: Direct API requests or domain state storage.

#### `projects/admin/src/app/services/`
- **Why it exists**: Core application-specific state stores (such as `ListPagesQueryStore` which tracks filters, pagination, and sorting dynamically across pages).
- **Responsibilities**: Session states, app-level routing parameters.
- **Never belongs here**: Low-level HTTP requests or presentation states.

#### `projects/local-keenops/`
- **Why it exists**: Isolates reusable UI behaviors (such as virtual scroll, form change detection, and API query serialization) into a library project that can be built independently.
- **Responsibilities**: Base classes, generic utilities.
- **Never belongs here**: Domain schemas (`Occasion`, `Owner`, etc.) or module configurations.

#### `admin/src/shared/`
- **Why it exists**: Shared domain code that bridges the application shell with the backend schema.
- **Responsibilities**: Domain representations, PrimeNG wrappers, CRUD services.
- **Never belongs here**: Routes, layout menus, or framework wrappers.

---

## 3. Feature Modules & Lazy Loading

### Lazy Loading Strategy

The app utilizes **Route-Level Lazy Loading** to keep initial bundle sizes minimal. The root routing configuration (`app.routes.ts`) loads layout frames lazily:

```typescript
export const appRoutes: Routes = [
  {
    path: '',
    loadChildren: () => import('./frames/main/main.routes').then((m) => m.mainFrameRoutes),
    canActivate: [canActivateAuthentication],
    data: { accessType: RoleType.ADMIN },
  },
  ...
];
```

Inside each frame, child pages are also lazily imported:

```typescript
export const mainFrameRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./main.frame').then((m) => m.MainFrame),
    children: [
      {
        path: 'occasions',
        loadChildren: () => import('./pages/occasion/occasion.routes').then((m) => m.occasionRoutes),
      },
      ...
    ]
  }
];
```

This ensures that the code for `occasions` is only downloaded when the admin navigates to `/occasions`.

---

## 4. Guards & Interceptors

### Authentication Guards

Route security is enforced using Functional Guards provided by the SDK:
- **`canActivateAuthentication`**: Injected on the root and settings paths. It inspects the local token store, validates user roles against the route metadata (e.g., `data: { accessType: RoleType.ADMIN }`), and redirects unauthorized requests to `/auth` (the login flow).

### HTTP Interceptors

#### `authUrlRewriteInterceptor`
Because the core `@keenops/ng/auth` library is pre-packaged, it assumes standard authentication endpoints (e.g., `/auth/signin`, `/auth/signup`). However, our backend exposes separate admin authentication endpoints (`/for-admin/auth/sign-in`, etc.).

To solve this coupling issue without rewriting the SDK, the `authUrlRewriteInterceptor` intercepts outgoing HTTP requests and rewrites the URLs dynamically before they reach the network:

```typescript
const _AUTH_URL_REWRITES = [
  { from: /\/auth\/signin$/, to: '/for-admin/auth/sign-in' },
  { from: /\/auth\/signup$/, to: '/for-admin/auth/sign-up' },
  { from: /\/auth\/refresh-token\/[^/]+$/, to: '/for-admin/auth/refresh-token' },
];

export const authUrlRewriteInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) return next(req);

  for (const rewrite of _AUTH_URL_REWRITES) {
    if (rewrite.from.test(req.url)) {
      const newUrl = req.url.replace(rewrite.from, rewrite.to);
      return next(req.clone({ url: newUrl, method: rewrite.method ?? req.method }));
    }
  }
  return next(req);
};
```

---

## 5. HTTP Layer & Cache Strategies

Data retrieval uses a layered structure: `BaseCrudAPI` handles network requests, and `BaseDataService` handles caching.

```
[Page Store] ──► [Data Service] ──► [API Class] ──► [HttpClient]
```

### Caching and Request Deduplication (`BaseDataService<T>`)

The `BaseDataService<T>` handles caching and query deduplication:

1. **Deduplication**: If two components request the same list concurrently (e.g., two dropdown widgets loading occasion types), `BaseDataService` caches the pending `Promise` under a serialized cache key:
   ```typescript
   const pending = this.pendingRequests.get(cacheKey);
   if (pending) return pending;
   ```
2. **TTL Cache**: Cache results are stored for 5 minutes (`TTL = 5 * 60 * 1000`). If a valid cache entry exists, the service returns it directly.
3. **Automatic Eviction**: The cache uses a Simple Least Recently Used (LRU) mechanism, capped at 100 entries (`MAX_CACHE_SIZE`).
4. **Cache Invalidation**: Any write operation (`create`, `update`, `delete`) automatically invalidates the cache:
   ```typescript
   async update(id: string, data: Partial<T>): Promise<T> {
     const result = await this.api.update(id, data);
     this.invalidateCache();
     return result;
   }
   ```

---

## 6. State Management

The application implements a **Signal-Based Unidirectional State Architecture**. Rather than using NgRx or Akita, it relies on custom state classes that extend `AsyncStore<TState>`.

### Page State: `ListStore<T>`

All list views extend `ListStore<T>`. It maintains an immutable state containing:
- `entities`: Array of loaded records
- `totalCount`: Number of matching database documents
- `currentPage` & `pageSize`: Pagination parameters
- `sortField` & `sortOrder`: Sorting options
- `filters`: Active search criteria
- `loading` & `initialized`: Lifecycle states

These fields are exposed as read-only **Signals** via computed properties:

```typescript
readonly entities = computed(() => this.state()!.entities);
readonly loading = computed(() => this.state()!.loading);
readonly totalCount = computed(() => this.state()!.totalCount);
```

### Global Filters Persistence

`ListStore` integrates with `ListPagesQueryStore` to persist filters across routes:

```typescript
protected _persistCurrentState(): void {
  if (!this.persistenceConfig?.enabled || !this.listPagesStore) return;

  const state = this.state()!;
  this.listPagesStore.setPageState(this.persistenceConfig.pageKey, {
    filter: state.filters,
    sort: { field: state.sortField, order: state.sortOrder },
    pagination: { page: state.currentPage, limit: state.pageSize }
  });
}
```

If an admin filters the Occasions list, clicks into an occasion's details, and then returns to the list, the filters are restored from the `ListPagesQueryStore`.

---

## 7. UI & Theme Architecture

The UI architecture integrates **PrimeNG** for components and **TailwindCSS** for layout styling.

```
@use 'global_style.scss';                  <-- Tailwind & Global variables
@use 'themes/yfa-primeng.config.css';     <-- Custom Aura theme overrides
```

### CSS Layering Strategy

To resolve styling conflicts between Tailwind utility classes and PrimeNG components, style sheets are structured into CSS layers using the `@use` rules in `styles.scss` and configured in `app.config.ts`:

```typescript
providePrimeNG({
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.dark',
      cssLayer: {
        name: 'primeng',
        order: 'theme, base, primeng', // Tailwind loads first, PrimeNG overrides later
      },
    },
  },
})
```

---

## 8. Smart vs Dumb Components

The application follows the **Smart vs. Dumb Component Pattern** to separate data orchestration from user interface presentation.

| Component Type | Role | Implementation Example |
|---|---|---|
| **Smart (Container)** | Fetches data, interacts with stores, triggers alerts, handles navigation. | `OccasionListPage` (manages page lifecycle, hooks into `OccasionListPageStore`, navigates on select). |
| **Dumb (Presentational)** | Receives data via inputs, emits events via outputs, has no side effects. | `OccasionTableWidget` (renders a table, accepts inputs, and emits output events on edit/view/delete). |

### Base Component Contracts

To keep UI components consistent, presentational elements extend workspace base classes:

#### `AbstractTableWidget<T>`
Manages inline row editing inside PrimeNG datatables using reactive forms.
- Tracks active editing row IDs
- Clones original row data for cancellation rollbacks
- Normalizes sorting and pagination outputs

#### `AbstractForm<T>`
Provides a reactive form container.
- Creates form controls from initial entity data
- Disables inputs during data loading states
- Emits structured output payloads on save

---

## 9. Naming Conventions

The codebase enforces strict naming conventions:

- **Files**: kebab-case with type suffix:
  - `occasion-list.page.ts` (page route component)
  - `occasion-table.widget.ts` (presentational component)
  - `occasion-data.service.ts` (data wrapper)
  - `occasion.api.ts` (API resource endpoint)
  - `occasion-list-page.store.ts` (component-level store)
- **Classes**: PascalCase with type suffix matching the file: `OccasionListPageStore`, `OccasionTableWidget`.
- **Private Fields**: Prefixed with an underscore: `this._store`, `this._authService`.
- **Selectors**: Prefixed with `yfa` (Yalla Farha Admin): `yfa-occasion-table`.

---

## 10. Folder Tree

```
admin/
├── angular.json
├── package.json
├── tsconfig.json
├── projects/
│   ├── admin/
│   │   └── src/
│   │       ├── app/
│   │       │   ├── app.component.ts
│   │       │   ├── app.config.ts
│   │       │   ├── app.routes.ts
│   │       │   ├── config/
│   │       │   │   ├── admin-app.config.ts
│   │       │   │   ├── auth.config.ts
│   │       │   │   └── translate.config.ts
│   │       │   ├── frames/
│   │       │   │   ├── auth/
│   │       │   │   │   ├── auth.frame.ts
│   │       │   │   │   └── auth.routes.ts
│   │       │   │   └── main/
│   │       │   │       ├── main.frame.ts
│   │       │   │       ├── main.routes.ts
│   │       │   │       └── pages/
│   │       │   │           ├── dashboard/
│   │       │   │           └── occasion/
│   │       │   │               ├── occasion.page.ts
│   │       │   │               ├── occasion.routes.ts
│   │       │   │               └── sub-pages/
│   │       │   │                   ├── occasion-details/
│   │       │   │                   └── occasion-list/
│   │       │   │                       ├── occasion-list.page.ts
│   │       │   │                       └── occasion-list-page.store.ts
│   │       │   ├── interceptors/
│   │       │   │   └── auth-url-rewrite.interceptor.ts
│   │       │   └── services/
│   │       │       └── stores/
│   │       │           └── list-pages.store.ts
│   │       └── environments/
│   │           ├── environment.prod.ts
│   │           └── environment.ts
│   └── local-keenops/
│       └── src/
│           ├── public-api.ts
│           └── lib/
│               ├── services/
│               │   ├── api/
│               │   │   ├── api.service.ts
│               │   │   └── base-crud.api.ts
│               │   ├── data/
│               │   │   └── base-data.service.ts
│               │   └── store/
│               │       ├── detail.store.ts
│               │       └── list.store.ts
│               └── widgets/
│                   ├── abstract-form-base.widget.ts
│                   ├── abstract-modal-form-base.widget.ts
│                   ├── abstract-select/
│                   │   └── abstract-select.widget.ts
│                   └── abstract-table/
│                       └── abstract-table.widget.ts
└── src/
    └── shared/
        ├── models/
        │   ├── account.model.ts
        │   └── occasion.model.ts
        ├── services/
        │   ├── api/
        │   │   └── occasion.api.ts
        │   └── data/
        │       └── occasion-data.service.ts
        └── widgets/
            └── occasion/
                ├── occasion-form-modal/
                │   ├── occasion-form-modal.directive.ts
                │   └── smart-occasion-form-modal.widget.ts
                ├── occasion-table/
                │   └── occasion-table.widget.ts
                └── smart-occasion-select/
                    ├── smart-occasion-select.store.ts
                    └── smart-occasion-select.widget.ts
```

---

## 11. Component Hierarchy

This diagram shows how components are nested in the layout tree when viewing the occasions list view:

```
AppComponent (Root)
 └── RouterOutlet
      └── MainFrame (Layout Container)
           ├── TwkSideBarLayoutWidget (Wrapper sidebar structure)
           │    ├── TwkSideBarMenuWidget (Sidebar menu view)
           │    │    └── CdkMenu / CdkMenuItem
           │    └── PageLayoutWidget (Content panel wrapper)
           │         └── HeaderWidget (Title bar area)
           └── RouterOutlet
                └── OccasionPage (Feature Container)
                     └── RouterOutlet
                          └── OccasionListPage (Smart Container Component)
                               ├── OccasionTableFiltersWidget (Presentational filters widget)
                               ├── OccasionTableWidget (Dumb Row-Editable Grid Widget)
                               │    ├── KopsCellEditorWidget (Cell action wrapper)
                               │    ├── OccasionStatusSelectWidget (Drop selection component)
                               │    ├── OccasionCitySelectWidget (Drop selection component)
                               │    └── SmartImageInputWidget (Media upload component)
                               └── Button (Trigger modal)
                                    └── OccasionFormModalDirective (Dialog Orchestrator)
                                         └── SmartOccasionFormModalWidget (Dumb Dialog Widget)
                                              ├── OccasionStatusSelectWidget
                                              └── OccasionCitySelectWidget
```

---

## 12. Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                APPLICATION LAYER                                 │
│                                                                                  │
│   OccasionListPage (Smart Container)                                            │
│   ├── Component Store: OccasionListPageStore                                     │
│   └── Template:                                                                  │
│        ◄yfa-occasion-table [dataSource]="store.entities()"►                      │
│                                                                                  │
└────────┬───────────────────────────────────┬─────────────────────────────────────┘
         │ 1. Read Signals                   │ 2. Trigger Actions
┌────────▼──────────────────────────┐        │ (e.g. refresh(), delete())
│      STATE MANAGEMENT LAYER       │        │
│                                   │        ▼
│   OccasionListPageStore           │ ┌────────────────────────────────────────────┐
│   (extends ListStore)             ├─►             DOMAIN SERVICES                │
│   - Tracks Loading Signal         │ │                                            │
│   - Exposes Entities Signal       │ │   OccasionDataService                      │
│   - Handles Local Filters         │ │   (extends BaseDataService)                │
│                                   │ │   - Deduplicates Concurrent Loads          │
│   ListPagesQueryStore             │ │   - Caches GET requests for 5 minutes      │
│   - Persists filter state globally│ │   - Evicts caches on create/update/delete  │
│                                   │ │                                            │
└───────────────────────────────────┘ └──────────────┬─────────────────────────────┘
                                                     │ 3. Execute HTTP Call
                                                     ▼
                                      ┌────────────────────────────────────────────┐
                                      │              HTTP CLIENT / API             │
                                      │                                            │
                                      │   OccasionAPI (extends BaseCrudAPI)        │
                                      │   - Defines path: 'for-admin/occasion'     │
                                      │                                            │
                                      │   ApiService (Core HTTP wrapper)           │
                                      │   - Sets Auth Bearer Token headers         │
                                      │   - Appends Base API url                   │
                                      │                                            │
                                      │   authUrlRewriteInterceptor                │
                                      │   - Rewrites route links dynamically       │
                                      │                                            │
                                      └────────────────────────────────────────────┘
```

---

## 13. Architectural Strengths

1. **Boilerplate Reduction via UI Base Classes**: Presentational components like `OccasionTableWidget` inherit common functions (e.g. page changes, edit state tracking, cell cancellation rollbacks) from `AbstractTableWidget`. Developers only need to write form layouts and data mappings.
2. **Signal-Driven Template Performance**: The application uses signals for template binding. By avoiding standard change detection checks, only the parts of the DOM that actually change are re-rendered.
3. **State Persistence Across Navigation**: Since list stores use `ListPagesQueryStore` to track page parameters, the admin can navigate between different pages without losing filters or page settings.
4. **Optimistic UI Updates**: Functions like `_updateOccasionAsync` update local store states immediately. If the API request fails, they reload the original list in the background, making the UI feel fast and responsive.
5. **No Style Cascading Issues**: The CSS layering structure (`cssLayer` configurations) orders style rules so that tailwind utility classes don't conflict with PrimeNG's component theme.
6. **URL Rewriting Interceptor Pattern**: The `authUrlRewriteInterceptor` intercepts and rewrites authentication paths, decoupling the core `@keenops/ng/auth` SDK library from admin-specific endpoint paths.
7. **Cached Data Layer**: `BaseDataService` deduplicates concurrent loads and caches GET requests for 5 minutes, reducing the volume of duplicate API calls to the server.

---

## 14. Weaknesses

1. **No Real-Time State Sync**: If multiple admins update occasion records simultaneously, there is no real-time synchronization (e.g. via WebSockets or polling). State is only refreshed on manual reload or page navigation.
2. **Local Library Build Overhead**: `local-keenops` is configured as a packageable library using `ng-packagr`. While this separates concerns, it requires keeping watch builds active, which increases local CPU overhead during development.
3. **Explicit Form Mutator Side Effects**: In `AbstractTableWidget.onRowEditCancel`, the original row properties are rolled back using `Object.assign(entity, original)`. This directly mutates reference objects, which can cause side effects in parent components.
4. **Single-Token Local Storage Dependency**: The `ApiService` reads the JWT authorization token directly from `localStorage`. If token structures or storage strategies change in the future, developers must edit this service directly instead of relying on an auth store interface.
5. **Form Mapping Duplication**: Validation logic is split. Form fields are defined in the component (e.g., `smart-occasion-form-modal.widget.ts`), while model properties are defined in the schema model.
6. **No Offline Mode Handling**: The application does not handle offline states. If the server is unreachable, the store enters an `errored` state, but there is no mechanism to queue operations or notify the user to check their connection.

---

## 15. Architectural Rules

These architectural rules govern the admin frontend code:

### Component Rules
- **Presentational components (widgets) must not inject stores.** They receive data via inputs and emit changes via outputs.
- **Widgets that render tables with row editing must extend `AbstractTableWidget<T>`.**
- **Modal forms must extend `AbstractModalForm<T>`** and use `AbstractModalDirective` to trigger dialog overlays.
- **Select dropdowns that pull dynamic data must extend `AbstractSelectWidget<T>`.**
- **Components must use `OnPush` Change Detection** to optimize rendering performance.

### Service & State Rules
- **Components must not inject Mongoose models.** They interface only with model definition files from `@models/*`.
- **Views must not consume API classes directly.** Components must interact with `DataServices` (`OccasionDataService`) which handle caching.
- **Stores must extend `AsyncStore` or `ListStore`.** Raw state objects must not be updated directly; all mutations must flow through `setState`.
- **Filters, sorting, and page parameters must be persisted globally using `ListPagesQueryStore`** for all entity lists.
