# Fitness Challenge

A fitness tracking app with a React frontend and a Spring Boot backend. Users can register, log activities, view a personal dashboard, and check a leaderboard.

The backend must be running before frontend API features (register, log activity, dashboard, leaderboard) will work.

```text
neogov/
  frontend/   React + Vite UI (port 3000)
  backend/    Spring Boot REST API (port 8080, context path /api)
```

## Prerequisites

Install these **before** cloning and running the project.

| Tool | Version | Why |
| --- | --- | --- |
| Git | latest | Clone the repository |
| Node.js | **20 LTS or newer** (Node **22+** recommended for tests) | Frontend (Vite 5, React 18). Vitest/jsdom work best on Node 22+ |
| npm | comes with Node.js | Install frontend packages |
| JDK | **17** | Required by the backend (`java.version` in `backend/pom.xml`) |
| PostgreSQL | **16** (or compatible 14+) | Local database on `localhost:5432` |

You do **not** need to install Maven. The backend includes the Maven Wrapper (`mvnw.cmd`).

### Check versions (PowerShell)

```powershell
git --version
node --version
npm --version
java --version
psql --version
```

`java --version` should show **17**. If it shows 8, 11, or 21-only without 17, install JDK 17 and make sure it is first on your `PATH`.

## Clone the project

```powershell
git clone https://github.com/nikithesh-hr/fitness-challenge.git
cd fitness-challenge
```

If you already have the folder locally:

```powershell
cd C:\Users\nikit\Desktop\neogov
```

## 1. Create the database

PostgreSQL must be running. Create an empty database named `fitness_challenge`:

```powershell
psql -U postgres -c "CREATE DATABASE fitness_challenge;"
```

The backend connects using these defaults from `backend/src/main/resources/application.yml`:

| Setting | Default |
| --- | --- |
| Host / port | `localhost:5432` |
| Database | `fitness_challenge` |
| Username | `postgres` |
| Password | `admin` |
| Schema | created/updated automatically (`hibernate.ddl-auto: update`) |

If your PostgreSQL username or password is different, edit `backend/src/main/resources/application.yml` (`spring.datasource.username` and `spring.datasource.password`) to match your install. You can also put local overrides in `backend/src/main/resources/application-local.yml` (that file is gitignored).

## 2. Run the backend

Open a PowerShell window:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

The first run downloads Maven (if needed) and dependencies. Leave this window open.

When it is up:

- API base: [http://localhost:8080/api](http://localhost:8080/api)
- Swagger UI: [http://localhost:8080/api/swagger-ui.html](http://localhost:8080/api/swagger-ui.html)

### Backend tests

```powershell
cd backend
.\mvnw.cmd test
```

Tests use an in-memory H2 database (no PostgreSQL required for tests).

## 3. Run the frontend

Open a **second** PowerShell window:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

`.env.example` sets:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

Keep that value for local development. Vite also proxies `/api` to `http://localhost:8080`.

The UI is at [http://localhost:3000](http://localhost:3000). Backend CORS is configured for that origin, so do not switch the frontend to another port.

### Other frontend commands

```powershell
npm run build          # production build into dist/
npm run preview        # preview the production build
npm run test:run       # run tests once
npm run test:coverage  # tests with coverage
```

## Verify it works

1. Backend Swagger opens at [http://localhost:8080/api/swagger-ui.html](http://localhost:8080/api/swagger-ui.html).
2. Frontend opens at [http://localhost:3000](http://localhost:3000).
3. Register a user in the UI, then log an activity and open the dashboard / leaderboard.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| Backend fails on startup | PostgreSQL is not running, or database `fitness_challenge` was not created |
| `password authentication failed` | Username/password in `application.yml` do not match your PostgreSQL user |
| `Unsupported class file` / Java errors | JDK is not 17 (`java --version`) |
| Frontend loads but API calls fail | Backend is not running, or `VITE_API_BASE_URL` is wrong |
| CORS errors in the browser | Frontend is not on `http://localhost:3000` |
| `npm` / Vitest errors | Use Node 20+ (22+ for tests) |

## What Git does not commit

These are listed in `.gitignore` and are created on each machine:

- `frontend/node_modules/`
- `frontend/dist/`
- `frontend/.env` (copy from `.env.example`)
- `backend/target/`
- IDE folders (`.idea/`, `.vscode/`)

That is why every clone needs `npm install` and `.\mvnw.cmd spring-boot:run`. Those commands restore dependencies; they are not started by `.gitignore`.
