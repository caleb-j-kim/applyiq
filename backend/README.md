# ApplyIQ backend

Spring Boot REST API for ApplyIQ. Implements the `auth`, `users`,
`applications`, `resumes`, `dashboard`, and `notifications` modules. The
`ai` module (resume match scoring, interview prep generation, follow-up
drafting, skill extraction) is designed but on hold pending a model/provider
decision.

## Stack

- Java 21, Spring Boot 4.1 (Web, Data JPA, Security, Validation)
- PostgreSQL (including `bytea` storage for resume file bytes — see
  `../database/README.md`)
- JWT auth (`io.jsonwebtoken`/jjwt)
- Lombok
- Maven (via included wrapper — no local Maven install needed)

## Requirements

- **JDK 21+** — this machine currently only has JDK 8 installed, which
  cannot build this project. Install a JDK 21 (e.g. [Eclipse Temurin](https://adoptium.net/))
  and point `JAVA_HOME` at it before running the commands below.
- PostgreSQL running locally, or use `docker-compose up -d --build` from the
  repo root, which starts both Postgres and the backend for you.

## Getting started

```bash
cp .env.example .env   # adjust values as needed
./mvnw spring-boot:run
```

The API starts on `http://localhost:8080`.

## Endpoints so far

All endpoints are prefixed `/api`. Every authenticated endpoint scopes data
to the logged-in user — trying to read, edit, or delete another user's
resource returns 404, not a leak.

| Method | Path                             | Auth | Notes |
|--------|----------------------------------|------|-------|
| POST   | /auth/register                   | no   | |
| POST   | /auth/login                      | no   | |
| GET    | /auth/me                         | yes  | |
| POST   | /applications                    | yes  | |
| GET    | /applications                    | yes  | optional `status` and `search` query params; sorted by date applied, most recent first |
| GET    | /applications/{id}                | yes  | |
| PATCH  | /applications/{id}                | yes  | |
| PATCH  | /applications/{id}/status         | yes  | |
| DELETE | /applications/{id}                | yes  | |
| POST   | /resumes                          | yes  | multipart upload, field name `file`; PDF/DOC/DOCX only, 5MB max; first upload for a user is auto-marked active |
| GET    | /resumes                          | yes  | metadata only (no file bytes), newest first |
| GET    | /resumes/{id}                     | yes  | metadata only |
| GET    | /resumes/{id}/download             | yes  | returns the raw file bytes with correct `Content-Type`/`Content-Disposition` |
| PATCH  | /resumes/{id}/active               | yes  | marks this resume active and un-marks any other active resume for the user (only one active resume at a time) |
| DELETE | /resumes/{id}                     | yes  | if the deleted resume was active, the next most recent resume is auto-promoted to active |
| GET    | /dashboard                        | yes  | aggregate stats: totals, referral/interview rates, status breakdown, 6-week application activity, recent applications, follow-ups-needed heuristic |
| POST   | /notifications                    | yes  | optional `jobApplicationId` to link a notification to an application (ownership-checked) |
| GET    | /notifications                    | yes  | optional `unreadOnly=true` query param |
| GET    | /notifications/unread-count        | yes  | |
| GET    | /notifications/{id}                | yes  | |
| PATCH  | /notifications/{id}/read           | yes  | |
| PATCH  | /notifications/read-all            | yes  | |
| DELETE | /notifications/{id}                | yes  | |

## Project structure

```
src/main/java/com/applyiq/
  auth/           RegisterRequest/LoginRequest/AuthResponse, AuthController,
                  AuthService, JwtService, JwtAuthenticationFilter,
                  SecurityConfig, CustomUserDetailsService, UserPrincipal
  users/          User entity, UserRepository, UserService, UserResponse
  applications/   JobApplication entity, ApplicationStatus/PriorityLevel enums,
                  JobApplicationRepository (Specification-based filtering),
                  JobApplicationService, JobApplicationController,
                  create/update/status request DTOs, JobApplicationResponse
  resumes/        Resume entity (file bytes stored as bytea), ResumeRepository
                  (JPQL projection keeps file bytes out of list queries),
                  ResumeService (active-resume exclusivity, upload validation),
                  ResumeController (multipart upload + download)
  dashboard/      DashboardService (pure aggregation over JobApplication data,
                  no entity of its own), DashboardResponse, DashboardController
  notifications/  Notification entity, NotificationType enum, NotificationRepository,
                  NotificationService, NotificationController
  common/         ApiResponse, GlobalExceptionHandler, ValidationUtils,
                  exception/ (ResourceNotFoundException, EmailAlreadyExistsException,
                  InvalidFileException)
```

## Database

`ddl-auto: update` is used for now (no migration tool yet) — Hibernate
creates/updates all tables automatically from the `@Entity` classes on
startup, against the Postgres DB configured in `.env`. Full column-by-column
schema documentation, including tables planned for the `ai` module, lives in
`../database/README.md` — update that file whenever a table changes.

## Running with Docker

From the repo root:

```bash
docker-compose up -d --build
```

Use the standalone `docker-compose` command, not `docker compose` — this
machine's Docker CLI doesn't have the `docker compose` subcommand plugin
registered, only the separate `docker-compose` binary.

This brings up two containers, defined in `../docker-compose.yml`:

- **`db`** — `postgres:17-alpine`. Data persists in a named Docker volume
  (`db-data`), so it survives container restarts (but not `docker-compose
  down -v`, which deletes volumes). Has a healthcheck (`pg_isready`); the
  backend container waits for this to pass before starting. Exposed on host
  port `5432` by default (override with `DB_PORT` in the root `.env`).
- **`backend`** — built from `backend/Dockerfile`, a two-stage build:
  stage 1 uses `eclipse-temurin:21-jdk` to run `./mvnw package` and produce
  the Spring Boot jar; stage 2 copies just that jar into a slim
  `eclipse-temurin:21-jre` runtime image (so the final image doesn't carry
  Maven or the full JDK). Reads its DB connection, JWT secret, and port from
  environment variables set in `docker-compose.yml`, which in turn read from
  the root `.env`. Exposed on host port `8080` by default (override with
  `SERVER_PORT`).

Rerun `docker-compose up -d --build backend` after backend code changes —
plain `docker-compose up -d` does **not** rebuild the image, so code changes
won't be picked up without `--build`.

Useful commands:

```bash
docker-compose logs -f backend      # tail backend logs
docker exec -it applyiq-db-1 psql -U applyiq -d applyiq   # open a psql shell
docker-compose down                 # stop containers, keep data volume
docker-compose down -v              # stop containers AND delete the DB volume
```
