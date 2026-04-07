-- CreateEnum
CREATE TYPE "public"."SessionStatus" AS ENUM ('OPEN', 'ACTIVE', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."Mood" AS ENUM ('ANXIOUS', 'SAD', 'STRESSED', 'OKAY', 'GOOD');

-- CreateEnum
CREATE TYPE "public"."MessageType" AS ENUM ('TEXT', 'RESOURCE', 'NOTE');

-- AlterEnum
ALTER TYPE "public"."Role" ADD VALUE 'COUNSELLOR';

-- DropForeignKey
ALTER TABLE "public"."cleaning_assignments" DROP CONSTRAINT "cleaning_assignments_roomId_fkey";

-- DropForeignKey
ALTER TABLE "public"."cleaning_assignments" DROP CONSTRAINT "cleaning_assignments_staffId_fkey";

-- DropForeignKey
ALTER TABLE "public"."cleaning_feedback" DROP CONSTRAINT "cleaning_feedback_assignmentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."cleaning_feedback" DROP CONSTRAINT "cleaning_feedback_userId_fkey";

-- DropIndex
DROP INDEX "public"."complaints_roomNumber_idx";

-- DropIndex
DROP INDEX "public"."maintenance_tasks_createdByUserId_idx";

-- DropIndex
DROP INDEX "public"."maintenance_tasks_isPublic_idx";

-- CreateTable
CREATE TABLE "public"."counsellor_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "specialties" TEXT[],
    "availability" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counsellor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."counselling_sessions" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "counsellorId" TEXT NOT NULL,
    "status" "public"."SessionStatus" NOT NULL DEFAULT 'OPEN',
    "topic" TEXT,
    "mood" "public"."Mood",
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "sessionNotes" TEXT,
    "followUpDate" TIMESTAMP(3),
    "rating" INTEGER,
    "ratingComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counselling_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."counselling_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "public"."MessageType" NOT NULL DEFAULT 'TEXT',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "counselling_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "counsellor_profiles_userId_key" ON "public"."counsellor_profiles"("userId");

-- CreateIndex
CREATE INDEX "counselling_sessions_studentId_idx" ON "public"."counselling_sessions"("studentId");

-- CreateIndex
CREATE INDEX "counselling_sessions_counsellorId_idx" ON "public"."counselling_sessions"("counsellorId");

-- CreateIndex
CREATE INDEX "counselling_sessions_status_idx" ON "public"."counselling_sessions"("status");

-- CreateIndex
CREATE INDEX "counselling_messages_sessionId_idx" ON "public"."counselling_messages"("sessionId");

-- CreateIndex
CREATE INDEX "counselling_messages_senderId_idx" ON "public"."counselling_messages"("senderId");

-- CreateIndex
CREATE INDEX "counselling_messages_isRead_idx" ON "public"."counselling_messages"("isRead");

-- AddForeignKey
ALTER TABLE "public"."cleaning_assignments" ADD CONSTRAINT "cleaning_assignments_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cleaning_assignments" ADD CONSTRAINT "cleaning_assignments_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."cleaning_staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cleaning_feedback" ADD CONSTRAINT "cleaning_feedback_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "public"."cleaning_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cleaning_feedback" ADD CONSTRAINT "cleaning_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."counsellor_profiles" ADD CONSTRAINT "counsellor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."counselling_sessions" ADD CONSTRAINT "counselling_sessions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."counselling_sessions" ADD CONSTRAINT "counselling_sessions_counsellorId_fkey" FOREIGN KEY ("counsellorId") REFERENCES "public"."counsellor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."counselling_messages" ADD CONSTRAINT "counselling_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."counselling_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."counselling_messages" ADD CONSTRAINT "counselling_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
