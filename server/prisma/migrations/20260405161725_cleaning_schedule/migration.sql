-- CreateEnum
CREATE TYPE "public"."CleaningAssignmentStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'MISSED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."cleaning_staff" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "zone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cleaning_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cleaning_assignments" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "status" "public"."CleaningAssignmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cleaning_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cleaning_feedback" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cleaned" BOOLEAN NOT NULL DEFAULT true,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cleaning_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cleaning_assignments_scheduledStart_idx" ON "public"."cleaning_assignments"("scheduledStart");

-- CreateIndex
CREATE INDEX "cleaning_assignments_roomId_scheduledStart_idx" ON "public"."cleaning_assignments"("roomId", "scheduledStart");

-- CreateIndex
CREATE UNIQUE INDEX "cleaning_feedback_assignmentId_key" ON "public"."cleaning_feedback"("assignmentId");

-- CreateIndex
CREATE INDEX "cleaning_feedback_userId_submittedAt_idx" ON "public"."cleaning_feedback"("userId", "submittedAt");

-- AddForeignKey
ALTER TABLE "public"."cleaning_assignments" ADD CONSTRAINT "cleaning_assignments_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cleaning_assignments" ADD CONSTRAINT "cleaning_assignments_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."cleaning_staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cleaning_feedback" ADD CONSTRAINT "cleaning_feedback_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "public"."cleaning_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cleaning_feedback" ADD CONSTRAINT "cleaning_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

