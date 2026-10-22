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
| `totp_secret_enc` | text, nullable | Authenticator-app (TOTP) secret, AES-256-GCM encrypted with `EMAIL_TOKEN_KEY`; set when 2FA setup starts |
| `totp_enabled` | boolean, default false | Login requires a code once true; required to connect Gmail or send email |
| `totp_last_step` | bigint, nullable | Last 30-second step a code was accepted for (blocks code replay) |
| `totp_recovery_hashes` | text, nullable | Comma-separated SHA-256 hashes of unused one-time recovery codes |
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

### `email_connections`
A user's linked Gmail inbox for the email automation (`com.applyiq.email`).
One row per user per provider. Tokens are AES-256-GCM encrypted with
`EMAIL_TOKEN_KEY`; rotating that key orphans every row (users must reconnect).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | FK → `users.id`; unique with `provider` |
| `provider` | varchar(16) (enum) | `GMAIL` (the only provider) |
| `email_address` | text | The connected inbox's address |
| `refresh_token_enc`, `access_token_enc` | text | Encrypted OAuth tokens |
| `access_token_expires_at` | timestamp | |
| `last_synced_at` | timestamp | Next sync reads mail received after this |
| `auto_update_status`, `auto_add_applications` | boolean | The two automation toggles on Settings |
| `created_at` | timestamp | |

### `follow_up_drafts`
Reusable plain-text follow-up emails (Follow-Ups → Drafts): `id`, `user_id` (FK → `users.id`),
`title`, `subtitle` (nullable), `description` (TEXT), `created_at`.

### `manual_follow_ups`
Follow-ups the user added by hand; the row is deleted once done or sent: `id`, `user_id`
(FK → `users.id`), `company_name`, `job_title`, `status` (varchar(32) enum), `date_applied`
(nullable), `recommended_action` (varchar(64), one of the model's action labels), `note`, `created_at`.

### `follow_up_dismissals`
"Mark as done" on a model recommendation: `id`, `user_id`, `job_application_id`,
`recommended_action`, unique together. Plain UUID columns with no FKs, so deleting an
application isn't blocked; the card returns if the model later recommends a different action.

## Planned tables (not yet built)

Designed but not implemented — still on hold:

- **`interview_prep`** — generated interview prep material (`technical_questions`, `behavioral_questions`, `skills_to_review`, `project_talking_points`, `sample_answers`), linked to a user + job application.

Follow-up recommendations are computed on request from `job_applications`
(`GET /api/follow-ups`) and not stored, so the planned
`follow_up_recommendations` table was dropped.
