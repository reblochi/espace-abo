-- CreateTable
CREATE TABLE "espace_abo"."psp_sessions" (
    "id" TEXT NOT NULL,
    "pspProvider" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "customerEmail" TEXT,
    "customerId" TEXT,
    "successUrl" TEXT NOT NULL,
    "cancelUrl" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "subscriptionMetadata" JSONB NOT NULL DEFAULT '{}',
    "paymentIntentMetadata" JSONB NOT NULL DEFAULT '{}',
    "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
    "paymentIntentId" TEXT,
    "subscriptionId" TEXT,
    "cofInitialUuid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "psp_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "psp_sessions_sessionId_key" ON "espace_abo"."psp_sessions"("sessionId");

-- CreateIndex
CREATE INDEX "psp_sessions_pspProvider_sessionId_idx" ON "espace_abo"."psp_sessions"("pspProvider", "sessionId");
