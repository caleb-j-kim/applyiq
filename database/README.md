# Database

PostgreSQL 17, run via `docker-compose` (service `db`, see `../docker-compose.yml`).

## Schema management

There are no hand-written `.sql` schema files. The backend uses Hibernate's
`ddl-auto: update` (see `backend/src/main/resources/application.yml`), which
generates and updates tables directly from the `@Entity` classes in
`backend/src/main/java/com/applyiq/**`. The Java entity classes are the
source of truth for the schema — to change a table, edit the entity, restart
the backend, and Hibernate applies the change.

`ddl-auto: update` is a development convenience, not a production migration
strategy (it never drops or renames columns, so schema drift accumulates
over time). If/when this moves toward production, revisit switching to
Flyway or Liquibase with versioned migration files — that's a new dependency
outside the original backend spec, so it needs explicit sign-off before
adding it.

**Update this file every time a table is added or an existing table's
columns change.**

## Current tables

### `users`
Account records.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `first_name` | text | |
| `last_name` | text | |
| `email` | text | unique |
| `password_hash` | text | bcrypt |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

### `job_applications`
One row per tracked job application, scoped to a user.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | FK → `users.id` |
| `company_name`, `job_title`, `location`, `job_url` | text | |
| `status` | text (enum) | `SAVED`, `APPLIED`, `ONLINE_ASSESSMENT`, `INTERVIEWING`, `FINAL_ROUND`, `OFFER`, `REJECTED`, `GHOSTED`, `WITHDRAWN` |
| `source` | text | e.g. LinkedIn, referral, career fair |
| `date_applied`, `last_contact_date` | date | |
| `has_referral` | boolean | |
| `referral_name`, `referral_relationship`, `referral_contact_info`, `referral_date`, `referral_notes` | text/date | |
| `recruiter_name`, `recruiter_email` | text | |
| `priority_level` | text (enum) | `LOW`, `MEDIUM`, `HIGH` |
| `job_description`, `notes` | text | |
| `follow_up_count` | int | |
| `created_at`, `updated_at` | timestamp | |

### `resumes`
Uploaded resume files, scoped to a user. **File bytes are stored directly in
Postgres (`bytea`), not on disk or in S3** — a deliberate deviation from an
earlier `file_url` design, made because the backend's production host isn't
finalized (Vercel can't run it; free-tier hosts like Render/Railway don't
guarantee persistent disks) and storing bytes in the DB needs zero new
infrastructure or dependencies regardless of where the backend ends up
deployed.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | FK → `users.id` |
| `file_name` | text | original filename |
| `content_type` | text | must be PDF or Word (`application/pdf`, `.doc`, `.docx`) |
| `file_size_bytes` | bigint | |
| `content` | bytea | the actual file bytes |
| `parsed_text` | text, nullable | extracted plain text of the resume; not yet populated — will be filled in by whatever the AI module ends up using for resume ingestion (a parsing library, or skipped entirely if the LLM is sent the raw PDF directly) |
| `is_active` | boolean | exactly one resume per user is active at a time — enforced in `ResumeService`, not a DB constraint |
| `created_at`, `updated_at` | timestamp | |

### `notifications`
In-app notifications, scoped to a user, optionally linked to a job application.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | FK → `users.id` |
| `job_application_id` | UUID, nullable | FK → `job_applications.id` |
| `type` | text (enum) | `FOLLOW_UP_REMINDER`, `STATUS_CHANGE`, `INTERVIEW_REMINDER`, `GHOSTING_RISK`, `GENERAL` |
| `title`, `message` | text | |
| `read` | boolean | |
| `created_at` | timestamp | |

## Planned tables (not yet built)

These belong to the `ai` module, which is on hold pending a model-provider
decision. Listed here for reference so the schema direction is documented:

- **`resume_match_analyses`** — AI-generated resume-to-job match results (`match_score`, `matched_skills`, `missing_skills`, `experience_gaps`, `suggested_resume_bullets`), linked to a user + job application + resume.
- **`interview_prep`** — generated interview prep material (`technical_questions`, `behavioral_questions`, `skills_to_review`, `project_talking_points`, `sample_answers`), linked to a user + job application.
- **`follow_up_recommendations`** — model-generated follow-up/status recommendations (`recommended_action`, `recommended_status`, `ghosting_risk_score`, `confidence_score`, `main_reasons`), linked to a user + job application.
