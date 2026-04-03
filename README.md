# DevLog

DevLog is a task tracker for engineering workflows built with Next.js 16, React 19, Prisma, and SQLite. The app lets you create and manage tasks, filter and sort the queue, and use AI to suggest the next task or generate subtasks for a larger item.

## Features

- Create, edit, and delete tasks
- Track status: `TODO`, `IN_PROGRESS`, `DONE`
- Track priority: `LOW`, `MEDIUM`, `HIGH`
- Filter tasks by status
- Sort tasks by priority and creation date
- Create hierarchical tasks via parent task / subtask relations
- Get an AI recommendation for the best next task to work on
- Generate a preview of subtasks from a task draft and save them to the database

## Tech Stack

- Next.js 16 (`app/` router)
- React 19
- TypeScript
- Prisma 7
- SQLite
- Tailwind CSS 4
- OpenAI SDK
- Zod
- React Hook Form

## Project Structure

```text
src/
  app/
    actions/           Server Actions for task mutations
    api/               Route Handlers for AI and subtask APIs
  components/          UI and task-related client components
  hooks/               Client hooks for filters, mutations, AI flows
  lib/                 Validation, constants, helpers, env, AI schemas
  services/            Business logic for tasks, prioritization, decomposition
prisma/
  schema.prisma        Database schema
  migrations/          Prisma migrations
  seed.ts              Seed entrypoint
  seeds/               Scenario-specific seeds
```

## Requirements

- Node.js 20+
- npm

## Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY="your_openai_api_key"
```

Notes:

- `DATABASE_URL` is required because Prisma and the app read it at startup.
- `OPENAI_API_KEY` is also required by the current env validation. Without it, the app will fail during startup even if you do not use AI features.

## Installation

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
```

## Running Locally

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## Database

The project uses SQLite with Prisma migrations.

Useful commands:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:format
npm run prisma:studio
```

## Seed Data

There are separate seeds for different scenarios:

```bash
npm run prisma:seed:priority
npm run prisma:seed:decomposition
npm run prisma:seed:clear
```

What they do:

- `prisma:seed:priority` fills the database with tasks for testing AI prioritization
- `prisma:seed:decomposition` fills the database with tasks for testing task decomposition
- `prisma:seed:clear` removes all tasks from the database

## AI Features

### 1. Task Prioritization

The app can analyze open tasks and suggest:

- one primary next task
- up to two alternatives
- one possible prerequisite if the dependency looks plausible

Implementation entrypoints:

- `POST /api/ai/prioritize`
- service: `src/services/prioritization.service.ts`

### 2. Task Decomposition

When creating or editing a task, the app can:

- assess whether the draft is ready for decomposition
- ask for clarification if the draft is too vague
- generate an ordered preview of subtasks
- save generated subtasks under the selected parent task

Implementation entrypoints:

- `POST /api/tasks/decompose-preview`
- `POST /api/tasks/[taskId]/subtasks`

## Main User Flows

### Task management

1. Create a task with title, description, status, and priority.
2. Open a task to edit it or delete it.
3. Filter the list by status.
4. Change sorting to inspect the queue from different angles.

### AI prioritization

1. Open the `AI Assistant` panel.
2. Run prioritization.
3. Review the recommended task, alternatives, and possible prerequisite.
4. Open the suggested task directly from the modal.

### AI subtask generation

1. Open a task modal.
2. Enter a clear title and description.
3. Generate a subtask preview.
4. Review the AI output.
5. Save the generated subtasks to the database.

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run prisma:seed:priority
npm run prisma:seed:decomposition
npm run prisma:seed:clear
npm run prisma:generate
npm run prisma:migrate
npm run prisma:format
npm run prisma:studio
```

## Data Model

The core entity is `Task`.

Fields:

- `id`
- `title` with a unique constraint
- `description`
- `status`
- `priority`
- `createdAt`
- `parentTaskId`

Task-to-subtask relations are implemented as a self-reference in Prisma.

## Notes for Development

- The app uses Server Actions for CRUD operations on tasks.
- AI endpoints are implemented as Route Handlers under `src/app/api`.
- Search params are used for task filtering and sorting on the main page.
- Current repository state includes a local SQLite database file: `dev.db`.
- There is no dedicated test script in `package.json` yet.
