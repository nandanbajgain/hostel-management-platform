-- Add professional counselling features

-- Add fields to CounsellorProfile for online status and presence tracking
ALTER TABLE "counsellor_profiles" ADD COLUMN "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "counsellor_profiles" ADD COLUMN "currentStatus" TEXT NOT NULL DEFAULT 'available';

-- Add readAt to CounsellingMessage for read receipts
ALTER TABLE "counselling_messages" ADD COLUMN "readAt" TIMESTAMP(3);

-- Create index for better query performance on read status
CREATE INDEX "counselling_messages_isRead_idx" ON "counselling_messages"("isRead");
CREATE INDEX "counsellor_profiles_isOnline_idx" ON "counsellor_profiles"("isOnline");
