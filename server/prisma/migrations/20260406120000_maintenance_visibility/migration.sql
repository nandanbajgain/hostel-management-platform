-- Add creator tracking and visibility controls for maintenance tasks
ALTER TABLE "public"."maintenance_tasks"
ADD COLUMN "createdByUserId" TEXT;

ALTER TABLE "public"."maintenance_tasks"
ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "public"."maintenance_tasks"
ADD CONSTRAINT "maintenance_tasks_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

CREATE INDEX "maintenance_tasks_createdByUserId_idx"
ON "public"."maintenance_tasks" ("createdByUserId");

CREATE INDEX "maintenance_tasks_isPublic_idx"
ON "public"."maintenance_tasks" ("isPublic");

