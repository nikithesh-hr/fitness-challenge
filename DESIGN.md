# Fitness Challenge — Design Document

---

## a. System Architecture & Data Flow

### Architecture Choice & Key Assumptions

The system is designed as a classic **three-tier web application**: a React single-page application (SPA) on the frontend, a RESTful Spring Boot API on the backend, and PostgreSQL as the relational store. This architecture was chosen based on the following assumptions about the application:

- **User base**: Small to medium — a single organisation or department running an internal fitness competition. Concurrent users are expected to be in the tens to low hundreds, not thousands.
- **Data volume**: Each user logs a handful of activities per week. Total activity rows will grow slowly; no partitioning or sharding is needed.
- **Read/write ratio**: Moderate reads (leaderboard, dashboard) and low writes (activity ingestion, registration). No special caching layer is required at this scale.
- **Deployment**: Single-machine local or containerised deployment. Horizontal scaling is not a current requirement; the design does not preclude it.
- **Authentication**: Explicitly out of scope for this implementation. No session, JWT, or OAuth layer is included.

These assumptions justify keeping the stack simple and avoiding premature complexity (message queues, microservices, caching tiers).

---



### High-Level System Diagram

```
 ┌────────────────────────────────────────────────────────────────────┐
 │                        BROWSER (Port 3000)                         │
 │                                                                    │
 │   Pages: Home · Register · Leaderboard · Dashboard · Log Activity  │
 │                                                                    │
 │   ┌──────────────┐  ┌──────────────────┐  ┌───────────────────┐   │
 │   │ React Router │  │  TanStack Query  │  │   Recharts        │   │
 │   │ (routing)    │  │  (server state,  │  │   (line chart,    │   │
 │   │              │  │   caching)       │  │    pie chart)     │   │
 │   └──────────────┘  └──────────────────┘  └───────────────────┘   │
 │                                                                    │
 │   Native Fetch API  ·  Tailwind CSS  ·  Vite (build tool)         │
 └────────────────────────────┬───────────────────────────────────────┘
                              │  HTTP / JSON
                              │  (CORS: localhost:3000 → localhost:8080)
                              ▼
 ┌────────────────────────────────────────────────────────────────────┐
 │               SPRING BOOT 3.3  ·  Java 17  (Port 8080/api)        │
 │                                                                    │
 │  ┌──────────────────────────────────────────────────────────────┐  │
 │  │  REST Layer                                                  │  │
 │  │  UserController    /v1/users/**  (register, recent,    │  │
 │  │                    search, dashboard, activities, DELETE)     │  │
 │  │  ActivityController /v1/activities, DELETE /v1/activities/{id}│ │
 │  │  LeaderboardController /v1/leaderboard?page=&size= (paginated)│  │
 │  └───────────────────────┬──────────────────────────────────────┘  │
 │                          │                                         │
 │  ┌───────────────────────▼──────────────────────────────────────┐  │
 │  │  Service Layer                                               │  │
 │  │  UserService · ActivityService · LeaderboardService          │  │
 │  │  DashboardService · ScoringEngine                            │  │
 │  └───────────────────────┬──────────────────────────────────────┘  │
 │                          │                                         │
 │  ┌───────────────────────▼──────────────────────────────────────┐  │
 │  │  Data Layer                                                  │  │
 │  │  UserRepository · ActivityRepository  (Spring Data JPA)      │  │
 │  │  Jakarta Validation  ·  GlobalExceptionHandler               │  │
 │  └───────────────────────┬──────────────────────────────────────┘  │
 └──────────────────────────┼─────────────────────────────────────────┘
                            │  JDBC / Hibernate ORM
                            ▼
 ┌────────────────────────────────────────────────────────────────────┐
 │               POSTGRESQL  (Port 5432)                              │
 │               Database: fitness_challenge                          │
 │                                                                    │
 │   Table: users      (UUID PK, first_name, last_name, email)        │
 │   Table: activities (UUID PK, user_id FK, sport, metric columns,   │
 │             points, extra_fields JSONB, recorded_at,               │
 │             idempotency_key UUID UNIQUE nullable)                  │
 └────────────────────────────────────────────────────────────────────┘
```

---



### Frontend Architecture

The frontend is a React 18 SPA built with Vite. It is structured around four concerns:

**Routing** — React Router v6 manages five routes: `/` (Home), `/register`, `/leaderboard`, `/dashboard`, `/log-activity`. Each route maps to a dedicated page component.

**Server state** — TanStack Query v5 handles all data fetching, caching, and background refetching. Custom hooks (`useLeaderboard`, `useDashboard`, `useActivities`, `useUserSearch`, `useRecentUsers`) wrap queries and expose loading/error states to pages. Mutations (register, ingest, delete user, delete activity) use `useMutation`; on success they invalidate relevant query caches so the UI stays consistent without a full page reload.

**API communication** — All HTTP calls go through a thin `apiClient.js` wrapper over the native Fetch API. It sets `Content-Type: application/json`, parses responses, and throws structured error objects (with `status` and `errors[]`) that TanStack Query and components consume.

**Presentation** — Pages compose small, focused components (forms, tables, charts). Charts (Recharts) receive pre-processed data from the page; no chart component fetches data directly.

```
src/
  api/          apiClient.js · userApi.js · activityApi.js · leaderboardApi.js
  hooks/        useLeaderboard · useDashboard · useActivities · useUserSearch · useRecentUsers
  pages/        HomePage · RegisterPage · LeaderboardPage · DashboardPage · LogActivityPage
  components/
    Navbar
    forms/      RegisterForm · LogActivityForm · UserSearchPicker
    dashboard/  StatsCards · SportBreakdownChart · WeeklyVolumeChart · ActivityHistoryTable
    leaderboard/ LeaderboardTable
```

---



### Backend Architecture

The backend follows a standard layered architecture — Controller → Service → Repository — enforced by Spring's dependency injection.

**REST Layer** — Controllers are thin. They delegate immediately to service methods and apply Jakarta Validation annotations (`@Valid`, `@ValidSport`, `@SportMetricConsistency`) to request bodies. No business logic lives here.

**Service Layer** — Contains all business logic: duplicate-user detection, point calculation delegation, dashboard aggregation, leaderboard ranking. Each service is `@Transactional`, using `readOnly = true` for queries to optimise connection handling.

**Data Layer** — Spring Data JPA repositories provide CRUD and custom JPQL queries. The leaderboard query uses a `LEFT JOIN` to include users with zero activities. Dashboard weekly volume uses `date_trunc('week', recorded_at)` grouped by ISO week Monday; results are sorted in the service layer (not in JPQL) to avoid `ORDER BY` alias conflicts. User search uses Spring Data's `Limit` parameter instead of `Pageable` to prevent `Orderable attribute expected` warnings from mixed JPQL/pageable sort resolution. `Page` responses use `@EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO)` for a stable JSON envelope. `Map<String, Object>` activity fields are mapped to the `jsonb` column using Hibernate's native `@JdbcTypeCode(SqlTypes.JSON)` annotation, which handles serialisation and deserialisation without a custom converter.

**Validation** — Two custom Jakarta validators enforce sport/metric consistency:

- `@ValidSport` — checks the sport string resolves to a known `SportType` enum value.
- `@SportMetricConsistency` — class-level validator that checks the correct metric field is present and no conflicting fields are supplied for the given sport.

**Error handling** — `GlobalExceptionHandler` (`@RestControllerAdvice`) catches all exception types and returns a consistent JSON envelope with `timestamp`, `status`, `error`, `message`, and `errors[]`.

---



### Request/Response Flow — User Registration

```
Browser (RegisterForm)
  │
  │  POST /api/v1/users/register
  │  { "firstName": "Jane", "lastName": "Smith", "email": "jane@example.com" }
  │
  ▼
UserController.register()
  │
  ├─ @Valid ──────────────────────────────────────────────────────────┐
  │   @NotBlank firstName, lastName                                   │
  │   @NotBlank @Email email                          failure → 400   │
  │                                                                   ┘
  ▼
UserService.register()
  │
  ├─ findByFirstNameIgnoreCaseAndLastNameIgnoreCase("Jane", "Smith")
  │    └─ found  ──────────────────────────────── DuplicateUserException → 409 Conflict
  │
  ├─ userRepository.save(new User)
  │    UUID auto-generated by PostgreSQL gen_random_uuid()
  │
  └─ UserRegistrationResponse { userId, firstName, lastName, email }
  │
  ▼
Browser
  └─ 201 Created — "Registration Successful" banner shown
     No user state stored in localStorage or session
```

---



### Request/Response Flow — Activity Data Ingestion

```
Browser (LogActivityForm)
  │
  │  POST /api/v1/activities
  │  {
  │    "userId":      "3fa85f64-...",
  │    "sport":       "RUNNING",
  │    "distanceKm":  5.25,
  │    "recordedAt":  "2026-08-14T07:30:00",
  │    "extraFields": { "heartRateBpm": 145, "weather": "sunny" }
  │  }
  │
  ▼
ActivityController.ingest()
  │
  ├─ @ValidSport ─────────────────────────────────────────────────────┐
  │   sport must resolve to SportType enum                failure → 400│
  │                                                                   ┘
  ├─ @SportMetricConsistency ─────────────────────────────────────────┐
  │   RUNNING/WALKING/CYCLING → distanceKm required,                  │
  │                             durationMinutes/stepCount forbidden    │
  │   GYM/SWIMMING            → durationMinutes required,             │
  │                             distanceKm/stepCount forbidden         │
  │   DAILY_STEPS             → stepCount required,                   │
  │                             distanceKm/duration forbidden          │
  │                                                    failure → 400   │
  │   All violations returned together as named field errors          ┘
  │
  ▼
ActivityService.ingest()
  │
  ├─ userRepository.findById(userId)
  │    └─ not found ──────────────────────────── UserNotFoundException → 404 Not Found
  │
  ├─ ScoringEngine.calculateDistancePoints(RUNNING, 5.25)
  │    points = floor(5.25 × 100) = 525
  │
  ├─ activityRepository.save(Activity)
  │    extra_fields { "heartRateBpm": 145, "weather": "sunny" } → JSONB column
  │    No validation applied to extraFields contents
  │
  └─ ActivityResponse {
       activityId, userId, sport: "RUNNING",
       distanceKm: 5.25, pointsAwarded: 525,
       extraFields: { heartRateBpm: 145 }, recordedAt
     }
  │
  ▼
Browser
  └─ 201 Created — awarded points displayed to user
     TanStack Query invalidates dashboard cache so updated stats appear immediately
```

---



## b. Database Schema & Data Model



### users


| Column     | Type         | Constraints                            |
| ---------- | ------------ | -------------------------------------- |
| id         | UUID         | PRIMARY KEY, default gen_random_uuid() |
| first_name | VARCHAR(100) | NOT NULL                               |
| last_name  | VARCHAR(100) | NOT NULL                               |
| email      | VARCHAR(255) | NOT NULL, UNIQUE (case-insensitive)    |
| created_at | TIMESTAMP    | NOT NULL, default now(), immutable     |




### activities


| Column           | Type          | Constraints                                        |
| ---------------- | ------------- | -------------------------------------------------- |
| id               | UUID          | PRIMARY KEY, default gen_random_uuid()             |
| user_id          | UUID          | NOT NULL, FK → users(id) ON DELETE CASCADE         |
| sport            | VARCHAR(50)   | NOT NULL, CHECK in enum set                        |
| distance_km      | NUMERIC(10,3) | nullable — populated for RUNNING, WALKING, CYCLING |
| duration_seconds | INTEGER       | nullable — populated for GYM, SWIMMING             |
| step_count       | INTEGER       | nullable — populated for DAILY_STEPS               |
| points           | INTEGER       | NOT NULL, CHECK >= 0                               |
| notes            | VARCHAR(500)  | nullable                                           |
| extra_fields     | JSONB         | NOT NULL, default '{}'                             |
| recorded_at      | TIMESTAMP     | NOT NULL                                           |
| created_at       | TIMESTAMP     | NOT NULL, default now(), immutable                 |
| idempotency_key  | UUID          | nullable, UNIQUE — stores client-supplied key for deduplication |




### Leaderboard (derived — no separate table)

Rankings are computed at query time via a JPQL LEFT JOIN aggregation on `users` and `activities`, using `COALESCE(SUM(a.points), 0)` so users with zero activities still appear at the bottom of the leaderboard.

### Duplicate User Detection

Two complementary layers enforce uniqueness for both name and email:

**Name uniqueness**

1. **Service layer** — `UserService.register()` calls `findByFirstNameIgnoreCaseAndLastNameIgnoreCase()` before saving. If a match exists, `DuplicateUserException` is thrown → `409 Conflict` with message *"A user with the name '...' is already registered."*
2. **Database layer** — `CREATE UNIQUE INDEX uq_users_name ON users(lower(first_name), lower(last_name))` acts as the structural safety net for concurrent inserts that bypass the service check.

**Email uniqueness**

1. **Service layer** — `UserService.register()` also calls `findByEmailIgnoreCase()` after the name check. If a match exists, `DuplicateEmailException` is thrown → `409 Conflict` with message *"A user with the email '...' is already registered."*
2. **Database layer** — `UNIQUE` constraint on the `email` column enforces uniqueness at the storage level.
3. **Fallback handler** — `GlobalExceptionHandler` catches `DataIntegrityViolationException` and returns `409 Conflict` with a generic message for any DB-level constraint violation that reaches the controller (defence-in-depth).

---



## c. API Specifications

Base URL: `http://localhost:8080/api`

All error responses share this envelope:

```json
{
  "timestamp": "2026-08-14T10:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "errors": [
    { "field": "distanceKm", "message": "distanceKm is required and must be > 0 for sport RUNNING" }
  ]
}
```

---



### POST /v1/users/register — Register a User

**Request body**

```json
{
  "firstName": "Jane",
  "lastName":  "Smith",
  "email":     "jane@example.com"
}
```

**Validation rules**


| Field     | Rule              |
| --------- | ----------------- |
| firstName | @NotBlank         |
| lastName  | @NotBlank         |
| email     | @NotBlank, @Email |


**Responses**


| Status | Condition               | Body                                     |
| ------ | ----------------------- | ---------------------------------------- |
| 201    | Created                 | `{ userId, firstName, lastName, email }`                                       |
| 400    | Validation failure      | Error envelope with `errors` array                                             |
| 409    | Duplicate name          | Error envelope — "A user with the name '...' is already registered."           |
| 409    | Duplicate email         | Error envelope — "A user with the email '...' is already registered."          |


---



### POST /v1/activities — Ingest an Activity

**Request body**

```json
{
  "userId":          "uuid",
  "sport":           "RUNNING",
  "distanceKm":      5.25,
  "durationMinutes": null,
  "durationSeconds": null,
  "stepCount":       null,
  "notes":           "Morning run",
  "recordedAt":      "2026-08-14T07:30:00",
  "extraFields":     { "heartRateBpm": 145, "weather": "sunny" }
}
```

**Validation — two-stage**

Stage 1 — field-level (`@Valid`):


| Field           | Rule                                                |
| --------------- | --------------------------------------------------- |
| userId          | @NotNull                                            |
| sport           | @NotBlank, @ValidSport (must be a known enum value) |
| distanceKm      | > 0, max 7 integer digits, 3 decimal places         |
| durationMinutes | >= 0                                                |
| durationSeconds | 0–59                                                |
| stepCount       | positive integer                                    |
| notes           | max 500 characters                                  |
| recordedAt      | @NotNull                                            |


Stage 2 — cross-field (`@SportMetricConsistency`):


| Sport                   | Required field  | Forbidden fields                             |
| ----------------------- | --------------- | -------------------------------------------- |
| RUNNING/WALKING/CYCLING | distanceKm      | durationMinutes, durationSeconds, stepCount  |
| GYM/SWIMMING            | durationMinutes | distanceKm, stepCount                        |
| DAILY_STEPS             | stepCount       | distanceKm, durationMinutes, durationSeconds |


`extraFields` accepts any arbitrary key/value pairs and is stored as JSONB — no validation is applied to its contents.

**Idempotency (opt-in)**

The endpoint supports a client-supplied idempotency key via an optional request header:

```
Idempotency-Key: f3a2b1c4-e5f6-7890-abcd-ef1234567890
```

- The key is a UUID generated by the client once per logical submission (the frontend uses `crypto.randomUUID()`).
- On first request: the activity is created and the key is stored in the `idempotency_key` column (unique constraint).
- On retry with the same key: the server returns the original stored `ActivityResponse` — no new record is inserted, no points are double-awarded.
- If the header is absent: the request is processed normally with no deduplication (backwards-compatible).
- The key is regenerated by the frontend only on successful submission, so network failures that prevent the success response from arriving will reuse the same key on retry.

**Responses**


| Status | Condition                  | Body                                                                                                                                    |
| ------ | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 201    | Created                    | `{ activityId, userId, sport, distanceKm, durationMinutes, durationSeconds, stepCount, pointsAwarded, notes, extraFields, recordedAt }` |
| 201    | Duplicate idempotency key  | Same body as original response — no new record created                                                                                  |
| 400    | Validation failure         | Error envelope with `errors` array                                                                                                      |
| 404    | userId not found           | Error envelope                                                                                                                          |


---



### GET /v1/users/recent — 4 Most Recently Registered Users

Returns the 4 users with the most recent `created_at` timestamp. Used by the `UserSearchPicker` dropdown to show a useful default set before any search text is entered.

**Response**: `200 OK` — array of up to 4 `{ userId, firstName, lastName, email }` objects, ordered by `created_at DESC`

---



### GET /v1/users/search?q={query} — Search Users

Filters users by partial case-insensitive match on first name, last name, or email. Returns all users when `q` is blank. Capped at **10 results** via Spring Data's `Limit` parameter (avoids dual-sort conflicts with the JPQL `ORDER BY`).

**Response**: `200 OK` — array of `{ userId, firstName, lastName, email }` (max 10 results)

---



### GET /v1/users/{userId}/dashboard — Personal Dashboard

**Response**: `200 OK`

```json
{
  "userId":          "uuid",
  "fullName":        "Jane Smith",
  "totalPoints":     1240,
  "totalActivities": 8,
  "sportBreakdown":  { "RUNNING": 800, "CYCLING": 440 },
  "weeklyVolume": [
    { "week": "2026-08-04", "totalPoints": 340, "activityCount": 3 },
    { "week": "2026-08-11", "totalPoints": 900, "activityCount": 5 }
  ]
}
```

`week` is the ISO Monday (YYYY-MM-DD) that starts the calendar week, produced by PostgreSQL `date_trunc('week', recorded_at)`.

---



### GET /v1/users/{userId}/activities?page=0&size=20 — Activity History

Returns a paginated list of a user's activities ordered by `recorded_at` descending.

**Response**: `200 OK` — stable `Page` envelope (via `@EnableSpringDataWebSupport(VIA_DTO)`) with `content`, `page.totalPages`, `page.totalElements`, `page.number`, `page.size`.

---



### GET /v1/leaderboard?page=0&size=10 — Global Leaderboard (Paginated)

Returns a paginated page of the global leaderboard. Default page size is **10**. All users are fetched and ranked globally in the service layer, then sliced by page — so ranks are correct across pages (rank 11 appears on page 2, not as rank 1).

**Query parameters**

| Parameter | Default | Description          |
| --------- | ------- | -------------------- |
| page      | 0       | Zero-based page index |
| size      | 10      | Entries per page     |

**Response**: `200 OK` — stable `Page` envelope (via `@EnableSpringDataWebSupport(VIA_DTO)`)

```json
{
  "content": [
    { "rank": 1, "userId": "uuid", "fullName": "Jane Smith", "totalPoints": 1240 },
    { "rank": 2, "userId": "uuid", "fullName": "John Doe",   "totalPoints": 0 }
  ],
  "page": {
    "size": 10,
    "number": 0,
    "totalElements": 25,
    "totalPages": 3
  }
}
```

All registered users appear regardless of activity count. Users with no activities are ranked last with 0 points. Clicking an athlete's name on the leaderboard navigates to their Personal Dashboard (`/dashboard?userId=<uuid>`).

---



### DELETE /v1/users/{userId} — Delete a User

Permanently deletes a user and **all their associated activities** (via `ON DELETE CASCADE` on the `activities.user_id` foreign key). This action is irreversible.

**Path parameter**

| Parameter | Type | Description                  |
| --------- | ---- | ---------------------------- |
| userId    | UUID | The ID of the user to delete |

**Responses**

| Status | Condition         | Body                              |
| ------ | ----------------- | --------------------------------- |
| 204    | Deleted           | Empty                             |
| 404    | User not found    | Error envelope with message       |

**Frontend behaviour** — The Global Leaderboard shows a 🗑 trash icon on each row. Clicking it triggers an inline confirmation ("Yes, delete" / "Cancel"). On confirmation, the frontend calls this endpoint via `useMutation`, then invalidates the `leaderboard` and `users` query caches so the table refreshes immediately.

---



### DELETE /v1/activities/{activityId} — Delete an Activity

Permanently deletes a single activity record. The user's aggregate statistics (total points, sport breakdown, weekly volume) reflect the removal immediately after the dashboard cache is invalidated. This action is irreversible.

**Path parameter**

| Parameter  | Type | Description                      |
| ---------- | ---- | -------------------------------- |
| activityId | UUID | The ID of the activity to delete |

**Responses**

| Status | Condition            | Body                        |
| ------ | -------------------- | --------------------------- |
| 204    | Deleted              | Empty                       |
| 404    | Activity not found   | Error envelope with message |

**Frontend behaviour** — The Personal Dashboard Activity History table shows a 🗑 trash icon on each row. Clicking it triggers an inline confirmation ("Yes, delete" / "Cancel"). On confirmation, the frontend calls this endpoint via `useMutation` inside `DeleteCell`, then invalidates both the `activities` and `dashboard` query caches so the table and stats cards update without a page reload.

---



## d. Scoring & Normalization Logic

All point values are integers. Flooring is applied before storing to ensure consistency.

### Distance Sports (RUNNING, WALKING, CYCLING)

```
points = floor(distanceKm × ratePerKm)
```


| Sport   | Rate per km |
| ------- | ----------- |
| RUNNING | 100 pts     |
| WALKING | 50 pts      |
| CYCLING | 25 pts      |


Example: 5.75 km run → `floor(5.75 × 100)` = **575 pts**

### Duration Sports (GYM, SWIMMING)

Only fully completed minutes count. Partial minutes are discarded before multiplication.

```
wholeMinutes = floor(totalSeconds / 60)
points       = wholeMinutes × ratePerMinute
```


| Sport    | Rate per minute |
| -------- | --------------- |
| SWIMMING | 15 pts          |
| GYM      | 5 pts           |


The API accepts `durationMinutes` + `durationSeconds` separately and combines them: `totalSeconds = (durationMinutes × 60) + durationSeconds`.

Example: 45 minutes 50 seconds of swimming → `floor(2750 / 60) = 45` whole minutes → `45 × 15` = **675 pts**

### Step Sport (DAILY_STEPS)

Points are awarded per fully completed block of 100 steps.

```
points = floor(stepCount / 100)
```

Example: 8 450 steps → `floor(8450 / 100)` = **84 pts**

### Extra Fields

`extraFields` is an open-schema JSONB map. It is persisted as-is and returned in responses. No scoring logic reads from it; it exists solely for candidates to attach arbitrary metadata (heart rate, weather, device, etc.) without schema changes.

---



## e. Frontend Architecture & Visualizations



### Technology Stack

- React 18, Vite, React Router v6
- TanStack Query v5 (server state, caching, background refetch)
- Recharts (charting)
- Tailwind CSS (styling)
- Native Fetch API (HTTP, wrapped in `src/api/apiClient.js`)



### Page & Component Breakdown

```
App
├── Navbar
│   └── Links: Home, Leaderboard, Dashboard, Log Activity, Register
│
├── HomePage          — Hero, quick-link cards, scoring reference table
│
├── RegisterPage
│   └── RegisterForm  — POST /v1/users/register; shows success banner; no state stored
│
├── LeaderboardPage
│   └── LeaderboardTable
│       ├── useLeaderboard(page)  →  GET /v1/leaderboard?page=N&size=10
│       ├── Renders rank (medal/number), full name, total points
│       ├── Athlete name is a link → /dashboard?userId=<uuid>
│       ├── Previous / Next pagination controls (hidden when totalPages ≤ 1)
│       └── Delete column: 🗑 icon → inline confirm → DELETE /v1/users/{id}
│           (useMutation in LeaderboardPage; resets to page 0; invalidates leaderboard + users caches)
│
├── DashboardPage  (also reachable via /dashboard?userId=<uuid> from leaderboard)
│   ├── UserSearchPicker  →  GET /v1/users/recent (default) or /v1/users/search?q=
│   │   Hidden when ?userId param is present; shows "← Back to Leaderboard" link instead        — total points, total activities
│   ├── SportBreakdownChart  →  PieChart (Recharts) from sportBreakdown map
│   ├── WeeklyVolumeChart    →  LineChart — points over time, date X-axis
│   └── ActivityHistoryTable →  paginated GET /v1/users/{id}/activities
│                                includes per-page point total footer row
│                                Delete column: 🗑 icon → inline confirm → DELETE /v1/activities/{id}
│                                (useMutation in DeleteCell; invalidates activities + dashboard caches)
│
└── LogActivityPage
    └── LogActivityForm
        ├── UserSearchPicker  →  search + inline register
        ├── Dynamic metric fields rendered per selected sport
        ├── Idempotency key: crypto.randomUUID() on mount, rotated on each success
        └── POST /v1/activities  +  Idempotency-Key header
```



### Global Leaderboard — Ranking Strategy

- Rankings are computed entirely in the backend via a JPQL `LEFT JOIN` + `GROUP BY` + `ORDER BY COALESCE(SUM(a.points), 0) DESC` query.
- The service fetches all users at once, assigns sequential global ranks, then slices by `page` and `size` using `PageImpl` — ranks are therefore correct across pages (rank 11 always appears on page 2).
- The controller returns a stable `Page<LeaderboardEntry>` envelope (VIA_DTO serialisation).
- Ranks 1–3 display medal icons; ranks 4+ display `#N`.
- All registered users are included (`LEFT JOIN`) so users with zero activities appear at the bottom ranked by insertion order when points are equal.
- Each athlete name is a `<Link>` to `/dashboard?userId=<uuid>`, navigating directly to their personal dashboard.
- Each row has a 🗑 delete button. Clicking it shows an inline confirmation (highlighting the row in red). Confirming calls `DELETE /v1/users/{userId}`, which cascades to delete all that user's activities at the database level. After deletion the page resets to 0.



### Personal Dashboard — Visualizations

**Sport Breakdown** — Recharts `PieChart` (donut) fed from `sportBreakdown: { RUNNING: 800, CYCLING: 440 }`. Each sport slice is labelled with its name and point total.

**Volume Over Time** — Recharts `LineChart` with:

- X-axis: calendar dates of ISO week Mondays (`Aug 04`, `Aug 11`). For datasets larger than 8 weeks, only the first date of each new month is labelled.
- Y-axis: total points, auto-scaled (`domain=[0, 'auto']`), compact-formatted (1K, 1M).
- Missing weeks (no activity) are filled with zero-value data points so the line is continuous with no gaps.
- `type="linear"` produces straight line segments between points.

**Activity History** — Paginated table (10 rows per page) with date, sport (icon + label), metric summary, and points per activity. Prev/Next pagination controls are always visible below the table; each button is disabled when the user is already on the first or last page respectively, so the controls are unobtrusive when there is only one page of data. A per-row 🗑 delete button shows an inline "Yes, delete" / "Cancel" confirmation. Confirming calls `DELETE /v1/activities/{activityId}` and invalidates both the `activities` and `dashboard` query caches so the table and stats cards update immediately without a page reload.

### User Search (UserSearchPicker)

A shared component used by both Dashboard and Log Activity pages:

- **Empty / focused state**: calls `GET /v1/users/recent` and shows the **4 most recently registered users** in the dropdown. A hint footer reads "Type to search all users".
- **Typing**: debounced `GET /v1/users/search?q=` filters by first name, last name, or email (max 10 results via `Limit`).
- **No match found**: optionally surfaces an inline "Register new user" form (enabled on Log Activity, disabled on Dashboard).
- **On select**: emits the full user object `{ userId, firstName, lastName, email }` to the parent.
- **Dashboard link mode**: when the Personal Dashboard is opened via `/dashboard?userId=<uuid>` from the leaderboard, the picker is hidden entirely and a "← Back to Leaderboard" link is shown instead.

---



## f. Trade-offs & Edge Cases



### 1. Activity ingestion idempotency — client-key pattern

`POST /v1/activities` supports opt-in idempotency via the `Idempotency-Key: <uuid>` request header (Stripe pattern). The frontend generates a UUID on mount and sends it with every submission. On success the key is rotated; on network failure the same key is reused on retry, causing the server to return the original response without creating a second record.

**Implementation**: an `idempotency_key UUID UNIQUE` column on the `activities` table. `ActivityService.ingest()` checks `findByIdempotencyKey(key)` before any write. If found, returns the cached `ActivityResponse` immediately with no DB insert. `apiClient.js` merges the `Idempotency-Key` header without overwriting `Content-Type` by destructuring `headers` out of options before spreading.

**Trade-off**: Keys are never expired — at very large scale a cleanup job or TTL index would be needed. Requests without the header remain non-idempotent; this is acceptable since the header is opt-in and always sent by the frontend.

### 2. Leaderboard computed at query time

Rankings are recalculated on every request via an aggregation query rather than maintained in a materialised leaderboard table.

**Trade-off**: Correct by construction — rankings are always up to date. Acceptable for moderate data volumes. At scale, a scheduled job or database trigger could maintain a pre-computed rankings table and invalidate it on new activity inserts.

### 3. Open `extraFields` schema

Any key/value pair is accepted and stored as JSONB without validation.

**Trade-off**: Maximum flexibility for candidates to attach custom metadata without backend schema changes. The downside is that invalid or nonsensical data can be persisted silently. A JSON Schema validation step could be added if structure is required in future.

### 4. Full-name uniqueness is case-insensitive at both layers

The service layer checks `findByFirstNameIgnoreCaseAndLastNameIgnoreCase` before saving. The reference SQL also defines `CREATE UNIQUE INDEX ON users(lower(first_name), lower(last_name))`.

**Trade-off**: Prevents obvious duplicates (e.g. "john doe" vs "John Doe") but may reject legitimate users who share a common name.

### 5. Concurrent registration race condition

If two requests for the same name arrive simultaneously, both may pass the service-layer duplicate check before either write completes, resulting in two rows.

**Mitigation**: The database-level unique index on `lower(first_name), lower(last_name)` acts as the final safety net. The second concurrent insert will fail with a constraint violation, which propagates as a `409 Conflict` to the caller.

### 6. Invalid sport / metric mismatch

Two validation annotations handle this:

- `@ValidSport` — rejects unknown sport strings at the field level before cross-field validation runs.
- `@SportMetricConsistency` — class-level validator that checks the correct metric field is present and no conflicting fields are supplied, returning specific per-field error messages.

Both are evaluated by the Jakarta Validation framework on every request; the `GlobalExceptionHandler` converts violations to a structured `400 Bad Request` response.

### 7. Scoring edge cases


| Case                 | Behaviour                                              |
| -------------------- | ------------------------------------------------------ |
| 0.001 km run         | `floor(0.001 × 100) = 0` pts — valid, 0 points awarded |
| 59 seconds gym       | `floor(59 / 60) = 0` whole minutes → 0 pts             |
| 99 steps             | `floor(99 / 100) = 0` pts                              |
| Negative distance    | Rejected by `@DecimalMin(inclusive=false)`             |
| durationSeconds = 60 | Rejected by `@Max(59)`                                 |

