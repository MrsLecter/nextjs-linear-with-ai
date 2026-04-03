PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_tasks" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parentTaskId" INTEGER,
    CONSTRAINT "tasks_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "tasks" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_tasks" ("createdAt", "description", "id", "priority", "status", "title")
SELECT "createdAt", "description", "id", "priority", "status", "title" FROM "tasks";

DROP TABLE "tasks";
ALTER TABLE "new_tasks" RENAME TO "tasks";

CREATE UNIQUE INDEX "tasks_title_key" ON "tasks"("title");
CREATE INDEX "tasks_parentTaskId_idx" ON "tasks"("parentTaskId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
