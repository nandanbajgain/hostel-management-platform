-- Track originating room number for faster on-ground follow-up
ALTER TABLE "public"."complaints"
ADD COLUMN "roomNumber" TEXT;

CREATE INDEX "complaints_roomNumber_idx"
ON "public"."complaints" ("roomNumber");

