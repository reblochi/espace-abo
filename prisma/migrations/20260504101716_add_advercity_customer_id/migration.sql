-- AlterTable
ALTER TABLE "espace_abo"."users"
  ADD COLUMN "advercityCustomerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_advercityCustomerId_key"
  ON "espace_abo"."users"("advercityCustomerId");
