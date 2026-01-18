# Gutsy (MVP)

![version](https://img.shields.io/badge/version-0.0.1-blue)
![node](https://img.shields.io/badge/node-22.14.0-green)

A modern, opinionated starter for building fast, accessible, AI-friendly web applications — the Gutsy MVP scaffold. Built with Astro, TypeScript, selective React components, Tailwind CSS, and Supabase for backend services.

## Table of Contents

- [Project name](#gutsy-mvp)
- [Project description](#project-description)
- [Tech stack](#tech-stack)
- [Getting started locally](#getting-started-locally)
- [Available scripts](#available-scripts)
- [Project scope](#project-scope)
- [Project status](#project-status)
- [License](#license)
- [Additional documentation](#additional-documentation)

## Project name

Gutsy (MVP) — repository scaffolded from `10x-astro-starter`.

## Project description

Gutsy is a starter + MVP scaffold for building a fast, accessible, and AI-friendly web app focused on user logs, photo uploads, and correlation analysis. The front-end uses Astro for hybrid rendering with interactive React components where needed; Supabase provides authentication, database (Postgres with RLS), storage, and RPCs for server-side correlation logic.

## Tech stack

- Frontend: Astro 5, TypeScript 5, React 19 (selective)
- Styling: Tailwind 4, Shadcn/ui
- Backend & infra: Supabase (Auth, PostgreSQL, Storage, RPCs)
- Validation: Zod
- Testing: Vitest (unit & integration tests), Playwright (E2E tests)
- CI/CD: GitHub Actions
- Hosting: Vercel (frontend), Supabase Cloud (database/storage)

Source files with more details: [\.ai/tech-stack.md](.ai/tech-stack.md)

## Getting started locally

Prerequisites

- Node.js: version specified in `.nvmrc` (22.14.0)
- A package manager: `npm`, `pnpm`, or `yarn`
- (Optional) Supabase project for backend services

Install dependencies

```bash
npm install
```

Environment

- Create a `.env` file (not committed). At minimum, provide Supabase environment variables if you plan to use backend features:

```env
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # only for server-side jobs
# Other env variables (add as needed)
```

- For E2E testing, create a `.env.test` file (not committed) with test environment variables. This file is automatically loaded when running `npm run dev:e2e`:

```env
SUPABASE_URL=your-test-supabase-url
SUPABASE_PUBLIC_KEY=your-test-supabase-anon-key
# OPENROUTER_API_KEY=your-test-openrouter-api-key (optional)
```

Run development server

```bash
npm run dev
```

Build for production

```bash
npm run build
npm run preview
```

Notes

- This repo expects Supabase usage (auth, storage, RPCs). If you don't have a Supabase project, the frontend will still run but API features will be disabled until configured.

## Available scripts

Scripts are taken from `package.json`:

- `dev`: Runs the Astro development server (`astro dev`).
- `dev:e2e`: Runs the Astro development server in test mode (`astro dev --mode test`). Loads `.env.test` file for E2E testing environment variables.
- `build`: Build the production site (`astro build`).
- `preview`: Preview the built site locally (`astro preview`).
- `astro`: Shortcut to run the `astro` CLI.
- `lint`: Run ESLint over the project (`eslint .`).
- `lint:fix`: Run ESLint and attempt to fix issues (`eslint . --fix`).
- `format`: Format files using Prettier (`prettier --write .`).
- `test`: Run unit and integration tests with Vitest.
- `test:e2e`: Run end-to-end tests with Playwright (automatically uses `dev:e2e` script).

## Project scope

Planned MVP features (from project notes):

- Authentication (sign-up / sign-in) via Supabase Auth
- Create, view, and manage logs with optional photos (Supabase Storage)
- Normalize ingredients (deterministic function, optional LLM fallback)
- Correlation engine implemented as a Postgres RPC (`get_top_triggers`)
- Zod-validated API endpoints
- Unit tests for deterministic logic and an E2E smoke test

Key design decisions / trade-offs

- React is used selectively only for interactive components.
- Supabase is used as the primary backend (no custom backend server).

## Project status

- Repository scaffolded (Astro + plugins + tooling). See `src/` for starter pages and components.
- Tech stack and MVP requirements documented in [\.ai/tech-stack.md](.ai/tech-stack.md) and [AGENTS.md](AGENTS.md).
- PRD file not found in repository; product requirements and prioritization may need consolidation.

TODO / next steps

- Add a proper PRD and link it at the repo root.
- Create `README`-linked environment example (e.g., `.env.example`).
- Add CI badges and GitHub Actions workflow if desired.
- Add a `LICENSE` file (none present currently).

## License

No license file detected in this repository. If you want to make this project open source, add a `LICENSE` file (for example, `MIT`). Until a license is added, the repository is effectively unlicensed.

## Additional documentation

- Project agent notes: [AGENTS.md](AGENTS.md)
- Copilot instructions: [.github/copilot-instructions.md](.github/copilot-instructions.md)
- Tech stack details: [\.ai/tech-stack.md](.ai/tech-stack.md)
- Project configuration: [package.json](package.json), [.nvmrc](.nvmrc)

# Gutsy

A modern, opinionated starter template for building fast, accessible, and AI-friendly web applications.

## Tech Stack

- [Astro](https://astro.build/) v5.5.5 - Modern web framework for building fast, content-focused websites
- [React](https://react.dev/) v19.0.0 - UI library for building interactive components
- [TypeScript](https://www.typescriptlang.org/) v5 - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) v4.0.17 - Utility-first CSS framework

## Prerequisites

- Node.js v22.14.0 (as specified in `.nvmrc`)
- npm (comes with Node.js)

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/Fariusz/Gutsy
cd Gutsy
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## Project Structure

```md
.
├── src/
│ ├── layouts/ # Astro layouts
│ ├── pages/ # Astro pages
│ │ └── api/ # API endpoints
│ ├── components/ # UI components (Astro & React)
│ └── assets/ # Static assets
├── public/ # Public assets
```

## AI Development Support

This project is configured with AI development tools to enhance the development experience, providing guidelines for:

- Project structure
- Coding practices
- Frontend development
- Styling with Tailwind
- Accessibility best practices
- Astro and React guidelines

### Cursor IDE

The project includes AI rules in `.cursor/rules/` directory that help Cursor IDE understand the project structure and provide better code suggestions.

### GitHub Copilot

AI instructions for GitHub Copilot are available in `.github/copilot-instructions.md`

### Windsurf

The `.windsurfrules` file contains AI configuration for Windsurf.

## Contributing

Please follow the AI guidelines and coding practices defined in the AI configuration files when contributing to this project.

## License

MIT
