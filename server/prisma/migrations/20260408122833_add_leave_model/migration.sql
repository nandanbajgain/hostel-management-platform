-- CreateEnum
CREATE TYPE "public"."LeaveType" AS ENUM ('HOME', 'MEDICAL', 'PERSONAL', 'EMERGENCY', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."LeaveStatus" AS ENUM ('PENDING', 'APPROVED_BY_WARDEN', 'APPROVED', 'REJECTED', 'CANCELLED');

-- AlterTable
ALTER TABLE "public"."counselling_messages" ADD COLUMN     "readAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."leaves" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "leaveType" "public"."LeaveType" NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "destination" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "parentContact" TEXT NOT NULL,
    "status" "public"."LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "wardenRemark" TEXT,
    "adminRemark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leaves_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leaves_studentId_idx" ON "public"."leaves"("studentId");

-- CreateIndex
CREATE INDEX "leaves_status_idx" ON "public"."leaves"("status");

-- CreateIndex
CREATE INDEX "leaves_fromDate_idx" ON "public"."leaves"("fromDate");

-- AddForeignKey
ALTER TABLE "public"."leaves" ADD CONSTRAINT "leaves_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
