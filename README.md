# DevLog

DevLog is a task tracker for engineering workflows built with Next.js 16, React 19, Prisma, SQLite, and Pinecone-backed retrieval. The app lets you create and manage tasks, classify them by work type, estimate effort on a fixed scale, and use AI to suggest the next task or generate subtasks for a larger item.

## Features

- Create, edit, and delete tasks
- Track status: `TODO`, `IN_PROGRESS`, `DONE`
- Track priority: `LOW`, `MEDIUM`, `HIGH`
- Track work type: `FEATURE`, `BUG`, `IMPROVEMENT`, `TECH_DEBT`, `INTEGRATION`, `REFACTOR`
- Track effort estimation on the fixed scale `0`, `1`, `2`, `3`, `5`, `8`
- Filter tasks by status
- Sort tasks by priority and creation date
- Create hierarchical tasks via parent task / subtask relations
- Get an AI recommendation for the best next task to work on
- Generate a preview of subtasks from a task draft and save them to the database
- Generate retrieval-grounded AI effort estimates from similar historical tasks

## Tech Stack

- Next.js 16 (`app/` router)
- React 19
- TypeScript
- Prisma 7
- SQLite
- Tailwind CSS 4
- OpenAI SDK
- Pinecone
- Zod
- React Hook Form

## Project Structure

```text
src/
  app/
    actions/           Server Actions for task mutations
    api/               Route Handlers for AI, task estimation, and admin/indexing APIs
  components/          UI and task-related client components
  hooks/               Client hooks for filters, mutations, AI flows
  lib/                 Validation, constants, helpers, env, AI schemas, vector search
  services/            Business logic for tasks, prioritization, decomposition, estimation
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
PINECONE_API_KEY="your_pinecone_api_key"
PINECONE_INDEX_NAME="devlog-tracker"
# Optional: direct host for the target Pinecone index
PINECONE_HOST=""
```

Notes:

- `DATABASE_URL` is required because Prisma and the app read it at startup.
- `OPENAI_API_KEY` is required for the existing AI flows and for server-side embedding generation.
- `PINECONE_API_KEY` and `PINECONE_INDEX_NAME` are required for the current vector-search infrastructure used by task estimation retrieval.
- `PINECONE_HOST` is optional and can be used to bind requests to a specific Pinecone index host when needed.

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
npm run prisma:seed:estimation
npm run prisma:seed:clear
```

What they do:

- `prisma:seed:priority` fills the database with tasks for testing AI prioritization
- `prisma:seed:decomposition` fills the database with tasks for testing task decomposition
- `prisma:seed:estimation` fills the database with completed historical tasks for AI estimation retrieval preparation
- `prisma:seed:clear` removes all tasks from the database

## AI Features

### 1. Task Prioritization

The app can analyze open tasks and suggest:

- one primary next task
- up to two alternatives
- one possible prerequisite if the dependency looks plausible

Implementation entrypoints:

- `POST /api/ai/prioritize`
- service: `src/services/task-prioritization.service.ts`

### 2. Task Decomposition

When editing an existing task, the app can:

- assess whether the draft is ready for decomposition
- ask for clarification if the draft is too vague
- generate an ordered preview of subtasks
- save generated subtasks under the selected parent task

Implementation entrypoints:

- `POST /api/ai/decompose-preview`
- `POST /api/tasks/[taskId]/subtasks`

### 3. Task Estimation

When editing an existing task, the app can estimate task size on the fixed scale `0`, `1`, `2`, `3`, `5`, `8` by combining the current draft with retrieved historical tasks that look similar. Estimates can either return a grounded recommendation with confidence and similar-task references, or ask for clarification when the draft is still too vague.

Implementation entrypoints:

- `POST /api/tasks/estimate`
- `POST /api/admin/index-historical-tasks`
- service: `src/services/task-estimation.service.ts`
- indexing service: `src/services/task-estimation-history-indexing.service.ts`

#### Limitations

- The feature is retrieval-augmented: it uses similar historical tasks as context, not direct project execution data.
- Pinecone indexing is populated manually through an admin endpoint for demo purposes, so retrieval quality depends on what has been indexed.
- Historical retrieval excludes tasks with estimation `0`, because that value is reserved for already decomposed parent/container tasks.
- Estimates are planning support, not precise forecasts or delivery guarantees.
- Output quality depends heavily on the quality, consistency, and coverage of the historical task data.

## Main User Flows

### Task management

1. Create a task with title, description, status, priority, work type, and estimation.
2. Open a task to edit it or delete it.
3. Filter the list by status.
4. Change sorting to inspect the queue from different angles.

### AI prioritization

1. Open the `AI Assistant` panel.
2. Run prioritization.
3. Review the recommended task, alternatives, and possible prerequisite.
4. Open the suggested task directly from the modal.

### AI subtask generation

1. Open an existing task in the task modal.
2. Enter a clear title and description.
3. Generate a subtask preview.
4. Review the AI output.
5. Save the generated subtasks to the database.

### AI task estimation

1. Open an existing task in the task modal.
2. Enter a clear title, description, and work type.
3. Run AI estimation.
4. Review either the estimate with confidence and similar tasks, or the clarification questions.
5. Save the task with the final estimation you want to keep.

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run prisma:seed:priority
npm run prisma:seed:decomposition
npm run prisma:seed:estimation
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
- `type`
- `estimation`
- `createdAt`
- `parentTaskId`

Task-to-subtask relations are implemented as a self-reference in Prisma. The foreign key currently uses `ON DELETE SET NULL`, so deleting a parent task does not cascade-delete its subtasks.

## Notes for Development

- The app uses Server Actions for CRUD operations on tasks.
- AI endpoints are implemented as Route Handlers under `src/app/api`.
- Task estimation uses embeddings plus Pinecone similarity search before calling the LLM for the final response.
- Search params are used for task filtering and sorting on the main page.
- Current repository state includes a local SQLite database file: `dev.db`.
- There is no dedicated test script in `package.json` yet.
