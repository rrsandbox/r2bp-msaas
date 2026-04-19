-- AlterTable
ALTER TABLE "AccessFeature"
ADD COLUMN "route" TEXT,
ADD COLUMN "showInMenu" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "showInDashboard" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 100;

-- CreateIndex
CREATE INDEX "AccessFeature_tenantId_showInMenu_idx" ON "AccessFeature"("tenantId", "showInMenu");

-- CreateIndex
CREATE INDEX "AccessFeature_tenantId_showInDashboard_idx" ON "AccessFeature"("tenantId", "showInDashboard");
