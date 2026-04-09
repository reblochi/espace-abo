-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "espace_abo";

-- CreateEnum
CREATE TYPE "espace_abo"."UserRole" AS ENUM ('USER', 'AGENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "espace_abo"."SubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'ENDED');

-- CreateEnum
CREATE TYPE "espace_abo"."DeadlineStatus" AS ENUM ('UPCOMING', 'PERFORMED', 'CANCELED');

-- CreateEnum
CREATE TYPE "espace_abo"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "espace_abo"."FileType" AS ENUM ('CNI', 'PASSEPORT', 'PERMIS', 'JUSTIFICATIF_DOMICILE', 'PHOTO_IDENTITE', 'ACTE_NAISSANCE', 'LIVRET_FAMILLE', 'CARTE_GRISE', 'CERTIFICAT_CESSION', 'CERTIFICAT_NON_GAGE', 'CONTROLE_TECHNIQUE', 'MANDAT', 'DECLARATION_PERTE', 'AUTRE');

-- CreateEnum
CREATE TYPE "espace_abo"."DocumentValidationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "espace_abo"."ProcessType" AS ENUM ('CIVIL_STATUS_BIRTH', 'CIVIL_STATUS_MARRIAGE', 'CIVIL_STATUS_DEATH', 'REGISTRATION_CERT', 'NON_PLEDGE_CERT', 'CRITAIR', 'IDENTITY_CARD', 'PASSPORT', 'DRIVING_LICENCE', 'KBIS', 'ADDRESS_CHANGE', 'CADASTRE', 'CRIMINAL_RECORD', 'SIGNALEMENT_MAIRIE');

-- CreateEnum
CREATE TYPE "espace_abo"."ProcessStatus" AS ENUM ('DRAFT', 'PENDING_DOCUMENTS', 'PENDING_PAYMENT', 'PAYMENT_PROCESSING', 'PAYMENT_FAILED', 'PAID', 'SENT_TO_ADVERCITY', 'IN_PROGRESS', 'AWAITING_INFO', 'COMPLETED', 'REFUNDED', 'CANCELED');

-- CreateEnum
CREATE TYPE "espace_abo"."InvoiceType" AS ENUM ('SUBSCRIPTION', 'PROCESS', 'CREDIT_NOTE');

-- CreateEnum
CREATE TYPE "espace_abo"."InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'VOID');

-- CreateEnum
CREATE TYPE "espace_abo"."DisputeStatus" AS ENUM ('NEEDS_RESPONSE', 'UNDER_REVIEW', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "espace_abo"."FormEventType" AS ENUM ('FORM_STARTED', 'STEP_ENTERED', 'STEP_COMPLETED', 'FORM_COMPLETED', 'FORM_ABANDONED');

-- CreateEnum
CREATE TYPE "espace_abo"."ContactSubject" AS ENUM ('DEMARCHE', 'ABONNEMENT', 'TECHNIQUE', 'SIGNALEMENT', 'RETRACTATION', 'DONNEES', 'AUTRE');

-- CreateEnum
CREATE TYPE "espace_abo"."ContactStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "espace_abo"."users" (
    "id" TEXT NOT NULL,
    "reference" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT,
    "role" "espace_abo"."UserRole" NOT NULL DEFAULT 'USER',
    "gender" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "birthDate" TIMESTAMP(3),
    "birthCountryId" INTEGER,
    "birthCityId" INTEGER,
    "birthCityName" TEXT,
    "address" TEXT,
    "addressExtra" TEXT,
    "zipCode" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'FR',
    "resetPasswordToken" TEXT,
    "resetPasswordExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "espace_abo"."family_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "gender" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "birthDate" TIMESTAMP(3),
    "birthCountryId" INTEGER,
    "birthCityId" INTEGER,
    "birthCityName" TEXT,
    "address" TEXT,
    "addressExtra" TEXT,
    "zipCode" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "espace_abo"."subscriptions" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "espace_abo"."SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "amountCents" INTEGER NOT NULL DEFAULT 990,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "canceledAt" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "includedProcessCount" INTEGER NOT NULL DEFAULT 0,
    "maxProcessPerMonth" INTEGER,
    "processCountResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pspProvider" TEXT NOT NULL DEFAULT 'stripe',
    "pspCustomerId" TEXT,
    "pspSubscriptionId" TEXT,
    "cardBrand" TEXT,
    "cardLast4" TEXT,
    "cardExpMonth" INTEGER,
    "cardExpYear" INTEGER,
    "unsubscribeToken" TEXT NOT NULL,
    "changeCardToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "espace_abo"."subscription_deadlines" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "deadlineNumber" INTEGER NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "espace_abo"."DeadlineStatus" NOT NULL DEFAULT 'UPCOMING',
    "paymentStatus" "espace_abo"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "refundedAmount" INTEGER,
    "pspInvoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_deadlines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "espace_abo"."processes" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "espace_abo"."ProcessType" NOT NULL,
    "status" "espace_abo"."ProcessStatus" NOT NULL DEFAULT 'DRAFT',
    "amountCents" INTEGER NOT NULL,
    "taxesCents" INTEGER NOT NULL DEFAULT 0,
    "serviceFeesCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "paidAt" TIMESTAMP(3),
    "pspProvider" TEXT,
    "pspPaymentId" TEXT,
    "stripePaymentIntent" TEXT,
    "isFromSubscription" BOOLEAN NOT NULL DEFAULT false,
    "partner" TEXT,
    "pricingCode" TEXT,
    "source" TEXT,
    "gclid" TEXT,
    "data" JSONB NOT NULL,
    "advercityId" TEXT,
    "advercityRef" TEXT,
    "advercityStatus" INTEGER,
    "lastSyncAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "mandatoryFileTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "espace_abo"."process_status_history" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "fromStatus" "espace_abo"."ProcessStatus" NOT NULL,
    "toStatus" "espace_abo"."ProcessStatus" NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "process_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "espace_abo"."process_files" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "fileType" "espace_abo"."FileType" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "validationStatus" "espace_abo"."DocumentValidationStatus" NOT NULL DEFAULT 'PENDING',
    "validationNote" TEXT,
    "validatedAt" TIMESTAMP(3),
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "process_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "espace_abo"."invoices" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "espace_abo"."InvoiceType" NOT NULL,
    "subtotalCents" INTEGER NOT NULL,
    "taxCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 20.0,
    "status" "espace_abo"."InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "paidAt" TIMESTAMP(3),
    "processId" TEXT,
    "deadlineId" TEXT,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "espace_abo"."subscription_process_usages" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "processType" "espace_abo"."ProcessType" NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_process_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "espace_abo"."disputes" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "deadlineId" TEXT,
    "processId" TEXT,
    "pspProvider" TEXT NOT NULL,
    "pspDisputeId" TEXT NOT NULL,
    "pspPaymentId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "espace_abo"."DisputeStatus" NOT NULL DEFAULT 'NEEDS_RESPONSE',
    "reason" TEXT,
    "adminNotes" TEXT,
    "creditNoteId" TEXT,
    "disputedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "espace_abo"."admin_audit_logs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "espace_abo"."consents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "textHash" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "strongAuth" TEXT,
    "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "espace_abo"."courriers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "courriers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "espace_abo"."pricing_profiles" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "paymentMode" TEXT NOT NULL,
    "subscriptionMonthlyPrice" INTEGER NOT NULL,
    "basePrice" INTEGER NOT NULL DEFAULT 3990,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "espace_abo"."form_configs" (
    "id" TEXT NOT NULL,
    "formType" "espace_abo"."ProcessType" NOT NULL,
    "partner" TEXT NOT NULL DEFAULT 'default',
    "pricingProfileId" TEXT NOT NULL,
    "pspProvider" TEXT NOT NULL DEFAULT 'stripe',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "espace_abo"."form_events" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "formType" "espace_abo"."ProcessType" NOT NULL,
    "stepIndex" INTEGER NOT NULL,
    "stepName" TEXT NOT NULL,
    "event" "espace_abo"."FormEventType" NOT NULL,
    "partner" TEXT,
    "pricingCode" TEXT,
    "source" TEXT,
    "processId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "espace_abo"."signalements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "adresse" TEXT,
    "zipCode" TEXT NOT NULL,
    "city" TEXT,
    "mairieName" TEXT,
    "mairieEmail" TEXT,
    "sentToMairie" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signalements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "espace_abo"."signalement_files" (
    "id" TEXT NOT NULL,
    "signalementId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signalement_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "espace_abo"."contact_submissions" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" "espace_abo"."ContactSubject" NOT NULL,
    "processReference" TEXT,
    "message" TEXT NOT NULL,
    "status" "espace_abo"."ContactStatus" NOT NULL DEFAULT 'NEW',
    "assignedTo" TEXT,
    "repliedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "espace_abo"."contact_replies" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "senderName" TEXT,
    "message" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "espace_abo"."contact_files" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "espace_abo"."email_templates" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fromEmail" TEXT,
    "fromName" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_reference_key" ON "espace_abo"."users"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "espace_abo"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_resetPasswordToken_key" ON "espace_abo"."users"("resetPasswordToken");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_reference_key" ON "espace_abo"."subscriptions"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "espace_abo"."subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_unsubscribeToken_key" ON "espace_abo"."subscriptions"("unsubscribeToken");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_changeCardToken_key" ON "espace_abo"."subscriptions"("changeCardToken");

-- CreateIndex
CREATE UNIQUE INDEX "processes_reference_key" ON "espace_abo"."processes"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "processes_advercityId_key" ON "espace_abo"."processes"("advercityId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_number_key" ON "espace_abo"."invoices"("number");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_processId_key" ON "espace_abo"."invoices"("processId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_deadlineId_key" ON "espace_abo"."invoices"("deadlineId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_process_usages_processId_key" ON "espace_abo"."subscription_process_usages"("processId");

-- CreateIndex
CREATE UNIQUE INDEX "disputes_pspDisputeId_key" ON "espace_abo"."disputes"("pspDisputeId");

-- CreateIndex
CREATE UNIQUE INDEX "disputes_creditNoteId_key" ON "espace_abo"."disputes"("creditNoteId");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_profiles_code_key" ON "espace_abo"."pricing_profiles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "form_configs_formType_partner_key" ON "espace_abo"."form_configs"("formType", "partner");

-- CreateIndex
CREATE INDEX "form_events_sessionId_idx" ON "espace_abo"."form_events"("sessionId");

-- CreateIndex
CREATE INDEX "form_events_formType_event_idx" ON "espace_abo"."form_events"("formType", "event");

-- CreateIndex
CREATE INDEX "form_events_formType_stepIndex_idx" ON "espace_abo"."form_events"("formType", "stepIndex");

-- CreateIndex
CREATE INDEX "form_events_createdAt_idx" ON "espace_abo"."form_events"("createdAt");

-- CreateIndex
CREATE INDEX "signalements_userId_idx" ON "espace_abo"."signalements"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "contact_submissions_reference_key" ON "espace_abo"."contact_submissions"("reference");

-- CreateIndex
CREATE INDEX "contact_submissions_email_idx" ON "espace_abo"."contact_submissions"("email");

-- CreateIndex
CREATE INDEX "contact_submissions_status_idx" ON "espace_abo"."contact_submissions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_slug_key" ON "espace_abo"."email_templates"("slug");

-- AddForeignKey
ALTER TABLE "espace_abo"."family_members" ADD CONSTRAINT "family_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "espace_abo"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "espace_abo"."subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "espace_abo"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "espace_abo"."subscription_deadlines" ADD CONSTRAINT "subscription_deadlines_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "espace_abo"."subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "espace_abo"."processes" ADD CONSTRAINT "processes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "espace_abo"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "espace_abo"."process_status_history" ADD CONSTRAINT "process_status_history_processId_fkey" FOREIGN KEY ("processId") REFERENCES "espace_abo"."processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "espace_abo"."process_files" ADD CONSTRAINT "process_files_processId_fkey" FOREIGN KEY ("processId") REFERENCES "espace_abo"."processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "espace_abo"."invoices" ADD CONSTRAINT "invoices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "espace_abo"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "espace_abo"."invoices" ADD CONSTRAINT "invoices_processId_fkey" FOREIGN KEY ("processId") REFERENCES "espace_abo"."processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "espace_abo"."invoices" ADD CONSTRAINT "invoices_deadlineId_fkey" FOREIGN KEY ("deadlineId") REFERENCES "espace_abo"."subscription_deadlines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "espace_abo"."subscription_process_usages" ADD CONSTRAINT "subscription_process_usages_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "espace_abo"."subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "espace_abo"."disputes" ADD CONSTRAINT "disputes_creditNoteId_fkey" FOREIGN KEY ("creditNoteId") REFERENCES "espace_abo"."invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "espace_abo"."consents" ADD CONSTRAINT "consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "espace_abo"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "espace_abo"."courriers" ADD CONSTRAINT "courriers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "espace_abo"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "espace_abo"."form_configs" ADD CONSTRAINT "form_configs_pricingProfileId_fkey" FOREIGN KEY ("pricingProfileId") REFERENCES "espace_abo"."pricing_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "espace_abo"."signalements" ADD CONSTRAINT "signalements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "espace_abo"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "espace_abo"."signalement_files" ADD CONSTRAINT "signalement_files_signalementId_fkey" FOREIGN KEY ("signalementId") REFERENCES "espace_abo"."signalements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "espace_abo"."contact_replies" ADD CONSTRAINT "contact_replies_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "espace_abo"."contact_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "espace_abo"."contact_files" ADD CONSTRAINT "contact_files_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "espace_abo"."contact_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

