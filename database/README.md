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
Uploaded resume files, scoped to a user. The DB row holds metadata only —
**file bytes live in S3** (`ResumeStorageService`), referenced by
`storage_key`. Each environment uses its own bucket (`applyiq-resumes-dev` /
`applyiq-resumes-prod`, see `AWS_S3_RESUME_BUCKET`).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | FK → `users.id` |
| `file_name` | text | original filename |
| `content_type` | text | must be PDF or Word (`application/pdf`, `.doc`, `.docx`) |
| `file_size_bytes` | bigint | |
| `storage_key` | text | S3 object key (`resumes/{userId}/{uuid}`); the actual file bytes live in S3, not this table |
| `parsed_text` | text, nullable | extracted plain text, populated at upload time by `ResumeTextExtractor` (Apache PDFBox for PDF, Apache POI for `.doc`/`.docx`); null if extraction fails (e.g. a scanned/image-only PDF with no text layer) — analysis endpoints reject a resume with no parsed text rather than silently analyzing nothing |
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

### `resume_match_analyses`
AI-generated resume-to-job match results. `job_application_id` is nullable —
a "preview" analysis (job description pasted ad hoc, never saved as a
tracked application) is still persisted for history/cost auditing, just
without that link.

Keyword list columns hold JSON text, not a normalized child table — these
are small, write-once, read-as-a-whole blobs with no need to query/filter
individual keywords, so a join-requiring table would add complexity for no
benefit.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | FK → `users.id` |
| `job_application_id` | UUID, nullable | FK → `job_applications.id` |
| `resume_id` | UUID | FK → `resumes.id` |
| `match_score` | int | `round(100 * found / total)` over the explicit job-description keyword count |
| `job_description_keywords`, `found_keywords`, `missing_keywords` | text (JSON) | `[{name, weight}]` — explicit skills, found via zero-LLM dictionary matching in `SkillExtractionService` against `SkillTaxonomy` |
| `predicted_found_keywords`, `predicted_missing_keywords` | text (JSON) | `[{name, weight}]` — implied/"hidden" skills Claude inferred, split by whether the resume's explicit skill list already covers them |
| `score_rationale` | text | 1-2 sentence explanation from Claude, specific to this posting/resume |
| `suggested_resume_bullets` | text (JSON) | `string[]`, only populated when the caller requests it (extra output tokens) |
| `created_at` | timestamp | |

## Planned tables (not yet built)

Designed but not implemented — still on hold:

- **`interview_prep`** — generated interview prep material (`technical_questions`, `behavioral_questions`, `skills_to_review`, `project_talking_points`, `sample_answers`), linked to a user + job application.
- **`follow_up_recommendations`** — model-generated follow-up/status recommendations (`recommended_action`, `recommended_status`, `ghosting_risk_score`, `confidence_score`, `main_reasons`), linked to a user + job application.
