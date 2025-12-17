# Application - Gutsy (MVP)

## Main problem
Users need a quick, reliable way to log meals (photo + normalized ingredients), record symptom severity, and surface likely trigger ingredients using a reproducible correlation engine to guide dietary decisions.

## Minimal feature set
- Auth: register / login (Supabase) — session handling, protected API routes, RLS.
- Create log: photo upload (Supabase Storage), normalized ingredient selector, symptom selector + severity (1–5), notes.
- View logs: calendar month view + day drilldown showing photo, ingredients, symptoms, severity.
- Correlation engine: Postgres RPC get_top_triggers(user_id, start_date, end_date, limit) returning ranked ingredients with consumption_count, avg_severity_when_present, baseline_avg_severity, trigger_score, confidence_interval.
- Server: Zod-validated endpoints (POST /api/logs, GET /api/logs, GET /api/triggers), use supabase from context.locals.
- Tests: unit tests for validation/service logic and one E2E smoke (sign-up → create log → view triggers).

## Must-have examples included in MVP spec
- Auth handling (required)
  - Description: Supabase Auth for sign-up / sign-in; server endpoints read user from context.locals.supabase.auth.getSession() and enforce RLS.
  - Deliverable: working auth flow and protected API examples.

- One business-logic function (required)
  - Example: normalizeIngredients(rawText: string): Promise<number[]>
    - Purpose: convert OCR/text input into normalized ingredient IDs (typeahead + dedupe). Implementation may optionally call an LLM for fuzzy matching and mapping to canonical ingredient IDs, but a deterministic fallback (tokenized matching + DB lookup) must exist for reproducibility.
    - Output: array of ingredient IDs with confidence scores.

- One CRUD function (required)
  - Example endpoint: GET /api/ingredients
    - Purpose: list normalized ingredients (pagination + search).
    - Validated with Zod query params; returns { id, name, usage_count }.

- Working test (required)
  - Unit test example: test normalizeIngredients maps common strings to canonical IDs
    - Expectations: given "cheddar cheese, milk" returns IDs for "Cheese" and "Milk" and confidence >= 0.8.
  - E2E smoke: sign-up → create log (with at least 2 ingredients, 1 symptom severity=4) → GET /api/triggers returns non-error and readable payload.

- CI/CD scenario (required)
  - GitHub Actions workflow (CI):
    - Trigger: push, pull_request on main and feature branches.
    - Steps: checkout, setup Node.js, install dependencies, run lint, run unit tests, run E2E smoke (headless), upload test artifacts; fail on any test or lint error.
  - Deploy step (optional gated): on main merge, build and deploy preview or production (e.g., Vercel/Supabase migration runner) with required env secrets.

## Out of scope for MVP
- Advanced image optimization pipeline or heavy media processing.
- Full UI/UX polish (shadcn components) beyond functional UI.
- Advanced statistical models, cohort comparisons, or ML workflows beyond the RPC and simple guardrails.
- Extensive caching, multi-layer performance tuning (short TTL cache only if necessary).
- Full retention/feedback systems (beyond a minimal feedback mechanism).

## Success criteria
- Functional
  - ≥100 registered pilot users OR ≥20 active users.
  - ≥50 logs created across pilot users.
  - RPC returns top triggers for ≥90% of users with sufficient data.
- Performance & quality
  - API error rate < 1% in smoke tests.
  - RPC median runtime < 300 ms for typical ranges.
  - Minimum sample guardrail: min_consumption_logs = 5; min_user_logs_for_analysis = 10.
  - Exclude results with overly wide confidence intervals (configurable threshold).
- Tests
  - Zod schemas covered by unit tests.
  - At least one passing E2E smoke flow (sign-up → create log → view triggers).

Next step: generate Supabase SQL migration for the schema, implement normalizeIngredients (deterministic + optional LLM fallback), implement GET /api/ingredients and POST /api/logs (Zod), add unit test for normalizeIngredients and a GitHub Actions CI workflow that runs lint, tests, and E2E smoke.