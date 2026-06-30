-- AlterTable: Change MessageLog.id from BigInt to Text (String)
-- Existing numeric values like "24" will remain as string "24" (data preserved)
ALTER TABLE "MessageLog" DROP CONSTRAINT "MessageLog_pkey";
ALTER TABLE "MessageLog" ALTER COLUMN "id" SET DATA TYPE TEXT USING "id"::TEXT;
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_pkey" PRIMARY KEY ("id");

-- AlterTable: Change WebhookDeliveryLog.id from BigInt to Text (String)
ALTER TABLE "WebhookDeliveryLog" DROP CONSTRAINT "WebhookDeliveryLog_pkey";
ALTER TABLE "WebhookDeliveryLog" ALTER COLUMN "id" SET DATA TYPE TEXT USING "id"::TEXT;
ALTER TABLE "WebhookDeliveryLog" ADD CONSTRAINT "WebhookDeliveryLog_pkey" PRIMARY KEY ("id");

-- Drop old autoincrement sequences (no longer needed)
ALTER TABLE "MessageLog" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "WebhookDeliveryLog" ALTER COLUMN "id" DROP DEFAULT;
