# PRD — Gutsy (MVP)

## 1. Executive summary — what and why

Gutsy is a privacy‑first, production‑ready web application for people with food intolerances. It enables fast ingestion of meal logs (photo + simple ingredient text input), symptom severity tracking, and reproducible identification of likely trigger ingredients via a deterministic correlation engine implemented as a Postgres RPC. The MVP objective is to validate signal quality and user utility during a 6‑week pilot.

## 2. Target user and problem

Target users: adults reporting food intolerances who want actionable, interpretable guidance about dietary triggers.

Problem: users lack a simple, reproducible tool to record meals and symptoms and to discover ingredients that correlate with symptom severity without opaque ML black boxes.

## 3. Scope and out‑of‑scope

In scope (MVP)

- Secure user auth and session handling (Supabase).
- Manual meal logging (photo optional) with simple ingredient text input.
- Symptom recording with severity (1–5).
- Day and month log views.
- Deterministic correlation RPC: get_top_triggers(user_id, start_date, end_date, limit).
- Zod‑validated server endpoints and services.
- Unit tests for validation/business logic and one E2E Playwright smoke test.
- CI pipeline (GitHub Actions) running lint, tests, and E2E; optional deploy step.

Out of scope (MVP)

- OCR/automatic ingredient extraction from photos.
- Advanced ML models, cohort analysis, or complex statistical pipelines beyond deterministic RPC + simple CI.
- Heavy media processing pipelines and advanced UI polish.
- Full multi‑role sharing (initial roles: user, admin; caregiver reserved for later).

## 4. Core functional requirements

Authentication & security

- Supabase Auth for sign‑up/login; server endpoints read user from context.locals.supabase.auth.getSession(); enforce RLS.
- Minimal privacy defaults: TLS, encryption at rest for sensitive assets, user data deletion endpoint.

Data & schema (summary)

- users (Supabase managed)
- logs: id (UUID), user_id, log_date (date), notes, meal_photo_url, created_at
- ingredients: id (INT PK), name (TEXT UNIQUE), source metadata
- symptoms: id (INT PK), name (TEXT UNIQUE)
- log_ingredients: log_id (UUID FK), ingredient_id (INT FK), source, raw_text, match_confidence
- log_symptoms: log_id (UUID FK), symptom_id (INT FK), severity (INT 1–5)

API surface (Zod validated)

- POST /api/logs — create log (photo upload via presigned/Supabase Storage); body includes ingredients (ids or raw_text), symptoms + severity, notes, log_date.
- GET /api/logs?start=&end=&page= — list logs for user; includes prejoined ingredients/symptoms.
- GET /api/ingredients — return seeded canonical list; POST /api/ingredients/report — propose new ingredient (admin review).
- GET /api/triggers?start=&end=&limit= — calls get_top_triggers RPC and returns ranked triggers.

Business logic

- normalizeIngredients(rawText: string): Promise<number[]> — deterministic mapping (tokenization + DB lookup) to canonical ingredient IDs; optional LLM fuzzy fallback but deterministic mapping is primary.

Correlation engine (Postgres RPC)

- Function: get_top_triggers(user_id UUID, start_date DATE, end_date DATE, limit INT)
- Returns per ingredient: ingredient_id, name, consumption_count, avg_severity_when_present, baseline_avg_severity, trigger_score, confidence_interval
- Trigger score formula (MVP): trigger_score = total_symptom_severity_when_present / total_logs_where_present
- Thresholds: min_consumption_logs = 5, min_user_logs = 10.
- CI: bootstrap or Wilson interval computed in RPC; results below thresholds or with excessively wide CI are omitted.

UI requirements (functional)

- Meal log flow: capture optional photo, select or enter ingredients, select symptoms and severity, add notes.
- Calendar month view with day drilldown showing photo, ingredients, symptoms, severities, and notes.
- Triggers view with date range selector and exported CSV/JSON option.

Testing & quality

- Unit tests: normalizeIngredients mapping, Zod schemas, service logic.
- E2E Playwright smoke: sign-up → create log (≥2 ingredients, 1 symptom severity=4) → GET /api/triggers returns 200 + readable payload.
- CI: lint, unit tests, E2E; run against ephemeral or dedicated test Supabase project with seed/teardown.

## 5. Security, privacy & compliance (production‑ready)

- Use Supabase built‑in auth and RLS policies: all row access scoped by auth.uid.
- Require user consent at sign‑up; provide a GDPR‑style data deletion endpoint and process.
- Store photos in a private Supabase storage bucket with signed URLs; expiry short by default.
- Rotate service keys via environment variables; store secrets in GH Actions Secrets for CI.
- Logging: redact sensitive PII in application logs.

## 6. Success metrics and KPIs

Pilot targets (6 weeks)

- Product usage: ≥20 active users, ≥50 total logs.
- Data sufficiency: RPC returns triggers for ≥90% of users that meet min_user_logs.
- Reliability: API error rate <1% in smoke tests; RPC median latency <300ms.
- Test coverage: unit tests for normalizeIngredients and Zod schemas; passing E2E smoke in CI.
- Signal quality: filter out results with wide CI; configurable CI threshold for production rollout.

Operational metrics

- CI pipeline success rate, mean test runtime, E2E flakiness rate.
- Storage usage and upload error rate for photos.
