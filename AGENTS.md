# AGENTS.md

## Project Overview

- Project name: `DevLog`
- Stack: Next.js 16, React 19, TypeScript, Prisma 7, SQLite, Tailwind CSS 4, OpenAI SDK, Pinecone, Zod, React Hook Form
- Main purpose: task tracker for engineering workflows with AI-assisted prioritization, task decomposition, and effort estimation
- Package manager: `npm`
- Runtime requirement: Node.js 20+

## Primary Product Flows

- CRUD for tasks with `TODO`, `IN_PROGRESS`, `DONE` statuses
- Priority-based task management with `LOW`, `MEDIUM`, `HIGH`
- Work-type classification with `FEATURE`, `BUG`, `IMPROVEMENT`, `TECH_DEBT`, `INTEGRATION`, `REFACTOR`
- Fixed task estimation scale with `0`, `1`, `2`, `3`, `5`, `8`
- Parent task / subtask hierarchy
- AI recommendation for the next best task
- AI-generated subtask preview and persistence
- AI task estimation grounded in similar historical tasks retrieved from Pinecone

## Repository Map

```text
src/
  app/
    actions/           Server Actions for task mutations
    api/               Route Handlers for AI, estimation, and admin/indexing APIs
  components/          UI and task-related client components
  hooks/               Client hooks for filters, mutations, AI flows
  lib/
    ai/                Prompts, schemas, AI feature types
    constants/         UI and domain constants
    db/                Prisma client
    env.ts             Environment validation
    types/             Shared domain and feature response types
    validation/        Zod schemas for task operations
    vector-search/     Embeddings, Pinecone client, retrieval helpers
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
- `src/app/api/ai/decompose-preview/route.ts`: AI subtask preview generation endpoint
- `src/app/api/tasks/estimate/route.ts`: AI task estimation endpoint
- `src/app/api/admin/index-historical-tasks/route.ts`: admin endpoint for indexing historical tasks into Pinecone
- `src/app/api/tasks/[taskId]/subtasks/route.ts`: persisted subtask creation endpoint
- `src/services/task.service.ts`: task CRUD and subtask persistence
- `src/services/task-prioritization.service.ts`: prioritization orchestration
- `src/services/task-decomposition.service.ts`: task decomposition orchestration
- `src/services/task-estimation.service.ts`: estimation orchestration wiring for retrieval and model responses
- `src/services/task-estimation-history-indexing.service.ts`: historical task indexing orchestration
- `src/lib/env.ts`: required environment validation
- `src/lib/vector-search/pinecone.ts`: Pinecone client setup
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
- `Task.type` and `Task.estimation` are first-class persisted fields; keep CRUD, seeds, and UI in sync when they change.
- Subtasks are modeled by Prisma self-reference through `parentTaskId`.
- Current delete relation uses `onDelete: SetNull`; deleting a parent task does not cascade-delete subtasks.
- Estimation value `0` is reserved for parent/container tasks that have already been decomposed.
- When creating AI-generated subtasks, preserve order in application logic before persistence.

## AI Integration Rules

- `OPENAI_API_KEY`, `PINECONE_API_KEY`, and `PINECONE_INDEX_NAME` are required by current env validation, so startup fails if they are missing.
- Keep prompts, schemas, and feature-specific AI types under `src/lib/ai/`.
- Validate AI outputs before saving to the database.
- Prefer deterministic post-processing in services over complex UI-level interpretation.
- Keep AI route handlers thin; orchestration belongs in services.
- Task estimation is retrieval-augmented; keep vector-search code in `src/lib/vector-search/` and indexing orchestration in services.

## Environment and Secrets

- Required env vars: `DATABASE_URL`, `OPENAI_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX_NAME`
- Optional env vars: `PINECONE_HOST`
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
npm run prisma:studio
npm run prisma:seed:priority
npm run prisma:seed:decomposition
npm run prisma:seed:estimation
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
- If you touch task decomposition, prioritization, or estimation, verify both schema expectations and UI consumers.
- If you touch task estimation, also check retrieval inputs, historical-task normalization, and Pinecone-facing code paths.
- If you add new behavior, update docs when the setup, workflow, or architecture meaningfully changes.

## Verification Checklist

- Run `npm run lint` after non-trivial changes when feasible.
- For Prisma schema changes, run `npm run prisma:generate` and validate migration files.
- For AI flow changes, verify both preview/generation paths and save/persist paths.
- For task estimation changes, verify request validation, clarification-vs-ready responses, and similar-task retrieval behavior.
- For indexing changes, verify `POST /api/admin/index-historical-tasks` assumptions against the current historical seed data and Pinecone metadata shape.
- For task model changes, verify parent/subtask behavior and sorting/filtering behavior.
- Note clearly if something could not be validated locally.

## Known Constraints

- There is currently no dedicated `test` script in `package.json`.
- The app relies on environment validation at startup, including OpenAI and Pinecone-related env vars.
- Local SQLite database file `dev.db` exists in the repository state; avoid unnecessary destructive operations.
