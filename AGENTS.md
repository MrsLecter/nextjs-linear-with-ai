# AGENTS.md

## Project Overview

- Project name: `DevLog`
- Stack: Next.js 16, React 19, TypeScript, Prisma 7, SQLite, Tailwind CSS 4, OpenAI SDK, Zod, React Hook Form
- Main purpose: task tracker for engineering workflows with AI-assisted prioritization and task decomposition
- Package manager: `npm`
- Runtime requirement: Node.js 20+

## Primary Product Flows

- CRUD for tasks with `TODO`, `IN_PROGRESS`, `DONE` statuses
- Priority-based task management with `LOW`, `MEDIUM`, `HIGH`
- Parent task / subtask hierarchy
- AI recommendation for the next best task
- AI-generated subtask preview and persistence

## Repository Map

```text
src/
  app/
    actions/           Server Actions for task mutations
    api/               Route Handlers for AI and subtask APIs
  components/          UI and task-related client components
  hooks/               Client hooks for filters, mutations, AI flows
  lib/
    ai/                Prompts, schemas, AI feature types
    constants/         UI and domain constants
    db/                Prisma client
    env.ts             Environment validation
    validation/        Zod schemas for task operations
  services/            Business logic for tasks and AI workflows
prisma/
  schema.prisma        Database schema
  migrations/          Prisma migrations
  seed.ts              Seed entrypoint
  seeds/               Scenario-specific seed data
```

## Important Files

- `src/app/page.tsx`: main task dashboard entrypoint
- `src/app/actions/task.actions.ts`: server actions for task mutations
- `src/app/api/ai/prioritize/route.ts`: AI prioritization endpoint
- `src/app/api/tasks/decompose-preview/route.ts`: subtask preview generation endpoint
- `src/app/api/tasks/[taskId]/subtasks/route.ts`: persisted subtask creation endpoint
- `src/services/task.service.ts`: task CRUD and subtask persistence
- `src/services/prioritization.service.ts`: prioritization orchestration
- `src/services/task-decomposition.service.ts`: task decomposition orchestration
- `src/lib/env.ts`: required environment validation
- `prisma/schema.prisma`: canonical data model

## Architecture Notes

- Keep business logic in `src/services/`; avoid pushing domain logic into route handlers or components.
- Use `src/app/actions/` for server mutations tied to UI forms and interactions.
- Use `src/app/api/` for AI-related and programmatic endpoints.
- Keep validation in Zod schemas under `src/lib/validation/`.
- Reuse shared domain types from `src/lib/types/` instead of recreating them inline.
- Prefer small, focused hooks in `src/hooks/` for client-side orchestration.

## Data Model Rules

- Core entity: `Task`
- `Task.title` is unique; account for this in create/update flows and seeds.
- Subtasks are modeled by Prisma self-reference through `parentTaskId`.
- Current delete relation uses `onDelete: SetNull`; deleting a parent task does not cascade-delete subtasks.
- When creating AI-generated subtasks, preserve order in application logic before persistence.

## AI Integration Rules

- `OPENAI_API_KEY` is required by current env validation, so startup fails if it is missing.
- Keep prompts, schemas, and feature-specific AI types under `src/lib/ai/`.
- Validate AI outputs before saving to the database.
- Prefer deterministic post-processing in services over complex UI-level interpretation.
- Keep AI route handlers thin; orchestration belongs in services.

## Environment and Secrets

- Required env vars: `DATABASE_URL`, `OPENAI_API_KEY`
- Do not hardcode secrets in source files, tests, seeds, or docs.
- Do not commit real API keys or regenerated secret values.
- If env validation changes, update `README.md` and any setup instructions in the same task.

## Prisma and Database Workflow

- Prisma client output is configured in `prisma/schema.prisma`; respect the custom output path.
- After schema changes, run `npm run prisma:generate`.
- For data model changes, create/update migrations instead of editing the database manually.
- Use SQLite-compatible patterns unless the datasource is intentionally changed.
- Seed scripts are scenario-specific; keep them focused and idempotent where practical.

## Development Commands

```bash
npm run dev
npm run build
npm run lint
npm run prisma:generate
npm run prisma:migrate
npm run prisma:format
npm run prisma:seed:priority
npm run prisma:seed:decomposition
npm run prisma:seed:clear
```

## Coding Guidelines

- Prefer TypeScript-first solutions with explicit types at module boundaries.
- Follow existing path alias usage such as `@/` and `#prisma/client`.
- Keep server/client boundaries explicit in Next.js files.
- Reuse existing UI primitives from `src/components/ui/` before creating new ones.
- Preserve established naming and file organization unless there is a strong reason to refactor.
- Add concise comments only where intent is non-obvious.

## Change Discipline

- Make minimal, local changes that fit the current architecture.
- Avoid broad refactors unless the task explicitly asks for them.
- When changing data flow, check impacts across server actions, route handlers, services, hooks, and UI.
- If you touch task decomposition or prioritization, verify both schema expectations and UI consumers.
- If you add new behavior, update docs when the setup, workflow, or architecture meaningfully changes.

## Verification Checklist

- Run `npm run lint` after non-trivial changes when feasible.
- For Prisma schema changes, run `npm run prisma:generate` and validate migration files.
- For AI flow changes, verify both preview/generation paths and save/persist paths.
- For task model changes, verify parent/subtask behavior and sorting/filtering behavior.
- Note clearly if something could not be validated locally.

## Known Constraints

- There is currently no dedicated `test` script in `package.json`.
- The app relies on environment validation at startup, including AI-related env vars.
- Local SQLite database file `dev.db` exists in the repository state; avoid unnecessary destructive operations.
