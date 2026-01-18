# AGENTS

## Dev environment tips

- **Stack:** Astro 5, TypeScript 5, React 19, Tailwind 4, Shadcn/ui.
- **Project layout:** follow the existing layout under `src/` (layouts, pages, api, middleware, db, components, lib, assets).
- **Supabase client:** use `src/db/supabase.client.ts` and `context.locals.supabase` from middleware rather than importing the client directly.
- **Env vars:** access `import.meta.env.SUPABASE_URL` and `SUPABASE_PUBLIC_KEY`; keep secrets in GH Actions Secrets for CI.
- **Shadcn UI:** components live in `src/components/ui` and map to aliases defined in `components.json`.

## Local setup & quick commands

- Install deps: `npm install` (or `pnpm install` if you use pnpm).
- Run dev server: `npm run dev` (project uses Astro dev workflow).
- Add shadcn component: `npx shadcn@latest add <component>`.

## Backend & Supabase

- **Client init:** create `src/db/supabase.client.ts` using `createClient<Database>(url, key)`.
- **Middleware:** add `src/middleware/index.ts` to attach Supabase to `context.locals.supabase`.
- **Migrations:** place SQL migrations in `supabase/migrations/` and name them `YYYYMMDDHHmmss_short_description.sql` (UTC) to match Supabase CLI conventions.
- **RLS policies:** enable row level security (RLS) for new tables and add granular policies (one per action/role). Document reason for each policy in comments.

## API & server

- Use Astro Server Endpoints for APIs; handler methods should be uppercase `POST`, `GET`, etc., and set `export const prerender = false` for endpoints.
- Use `zod` for input validation on all endpoints; extract validation & business logic into `src/lib/services`.
- Read Supabase session from `context.locals.supabase.auth.getSession()` in endpoints to enforce RLS.

## Frontend & React

- Use `.astro` for static layout; use React only for interactive parts (ingredient selector, date filters).
- Follow Rules of Hooks; prefer functional components and hooks (extract shared logic into `src/components/hooks`).
- Styling: use Tailwind; prefer `@layer` for organizing utilities and variants (dark:, sm:, md:). Avoid creating separate CSS files when possible.

## Testing instructions

- Run lint and unit tests locally before committing: `npm run lint` and `npm test` (or `pnpm turbo run test --filter <project_name>` in monorepos).
- Unit tests: cover Zod schemas and deterministic business logic such as `normalizeIngredients`.
- E2E smoke: provide a Playwright or similar smoke test that perfor

  ms: sign-up → create log → view triggers.

- CI: the GitHub Actions workflow should run lint, unit tests, and E2E smoke; fail on any error.

## Correlation engine & migrations

- Implement the correlation engine as a Postgres RPC: `get_top_triggers(user_id, start_date, end_date, limit)` returning ranked ingredients with counts, averages, trigger_score and CI.
- SQL migration rules: write SQL in lowercase, include header metadata, and add explanatory comments especially for destructive changes. Ensure RLS is enabled for new tables and include separate policies per action/role.

## Commits & PRs

- **Commit message format:** follow Conventional Commits. Prefix with `type(scope): description` (e.g., `feat(api): add get_top_triggers rpc`). Use `!` for breaking changes or include `BREAKING CHANGE:` in the footer.
- **PR title:** `[<project_name>] <Short description>`.
- Always run `npm run lint` and `npm test` before creating a PR; ensure migrations and seeds run successfully in CI.

## PRD / MVP notes (quick reference)

- MVP features: Supabase auth + RLS, create/view logs with photo + simple ingredient text input, `get_top_triggers` RPC, Zod-validated endpoints, unit tests + one E2E smoke.
- Data model highlights: `logs`, `symptoms`, `log_symptoms`. Simple text arrays for ingredients.

## Useful links & commands

- Add shadcn components: `npx shadcn@latest add <component>`.
- Run migration with Supabase CLI: `supabase migration run` (ensure `supabase/config.toml` exists and env vars are set).

---

_Generated from project rules and AI notes in `.cursor/rules` and `.ai`._
