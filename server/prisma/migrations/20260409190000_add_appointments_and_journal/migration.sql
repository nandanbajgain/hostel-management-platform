-- CreateEnum
CREATE TYPE "public"."AppointmentStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "public"."counselling_appointments" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMins" INTEGER NOT NULL DEFAULT 30,
    "status" "public"."AppointmentStatus" NOT NULL DEFAULT 'REQUESTED',
    "note" TEXT,
    "meetingLink" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counselling_appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."journal_entries" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sessionId" TEXT,
    "mood" "public"."Mood",
    "title" TEXT,
    "content" TEXT NOT NULL,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "counselling_appointments_sessionId_idx" ON "public"."counselling_appointments"("sessionId");

-- CreateIndex
CREATE INDEX "counselling_appointments_scheduledAt_idx" ON "public"."counselling_appointments"("scheduledAt");

-- CreateIndex
CREATE INDEX "counselling_appointments_status_idx" ON "public"."counselling_appointments"("status");

-- CreateIndex
CREATE INDEX "journal_entries_studentId_createdAt_idx" ON "public"."journal_entries"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "journal_entries_isShared_idx" ON "public"."journal_entries"("isShared");

-- AddForeignKey
ALTER TABLE "public"."counselling_appointments" ADD CONSTRAINT "counselling_appointments_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."counselling_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."counselling_appointments" ADD CONSTRAINT "counselling_appointments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entries" ADD CONSTRAINT "journal_entries_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entries" ADD CONSTRAINT "journal_entries_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."counselling_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

