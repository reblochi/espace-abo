-- AlterTable
ALTER TABLE "espace_abo"."subscription_deadlines"
  ADD COLUMN "refundNeedsReview" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "refundReviewReason" TEXT;
