# Tech Stack - Gutsy MVP

## Frontend

### Core Framework

- **Astro 5** - SSR/SSG framework with hybrid rendering
- **TypeScript 5** - Static typing for code safety
- **React 19** - Interactive components (forms, filters)

### Styling

- **Tailwind 4** - Utility-first CSS framework
- **Shadcn/ui** - Ready-made UI components (forms, calendar, dialogs)

## Backend

### Supabase (Backend-as-a-Service)

- **Authentication** - User registration/login
- **PostgreSQL** - Database with Row Level Security (RLS)
- **Storage** - Meal photo storage
- **RPC** - Server functions (`get_top_triggers` for correlation engine)

### Validation

- **Zod** - Schema validation for API endpoints and forms

## Infrastructure

### Hosting

- **Cloudflare Pages** - Frontend deployment (Astro SSR with edge functions)
- **Supabase Cloud** - Database and storage hosting

### CI/CD

- **GitHub Actions** - Automated tests, linting, deployment

## Testing

### Unit & Integration Tests

- **Vitest** - Fast unit and integration test framework for TypeScript/JavaScript
  - Used for testing utility functions, React hooks, services, and Zod schemas
  - Runs in Node.js environment with fast execution

### End-to-End Tests

- **Playwright** - Cross-browser E2E testing framework
  - Used for testing complete user flows (registration, login, log creation, trigger analysis)
  - Supports multiple browsers (Chrome, Firefox, Safari, Edge)
  - Runs in CI/CD pipeline via GitHub Actions

## Stack Justification

| MVP Requirement        | Solution          |
| ---------------------- | ----------------- |
| Auth (sign-up/sign-in) | Supabase Auth     |
| Meal photos            | Supabase Storage  |
| Logs (CRUD)            | PostgreSQL + RLS  |
| Ingredient correlation | PostgreSQL RPC    |
| API validation         | Zod schemas       |
| Fast UI                | Astro + Shadcn/ui |

## Constraints and Trade-offs

1. **React used selectively** - Only for interactive components (ingredient selector, date filters)
2. **No custom backend** - Full dependency on Supabase
3. **LLM for `normalizeIngredients`** - Optional, with deterministic fallback
