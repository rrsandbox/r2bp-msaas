-- CreateTable
CREATE TABLE "AccessFeature" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFeaturePermission" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "canAccess" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFeaturePermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccessFeature_tenantId_key_key" ON "AccessFeature"("tenantId", "key");

-- CreateIndex
CREATE INDEX "AccessFeature_tenantId_enabled_idx" ON "AccessFeature"("tenantId", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "UserFeaturePermission_tenantId_userId_featureId_key" ON "UserFeaturePermission"("tenantId", "userId", "featureId");

-- CreateIndex
CREATE INDEX "UserFeaturePermission_tenantId_userId_idx" ON "UserFeaturePermission"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "UserFeaturePermission_tenantId_featureId_idx" ON "UserFeaturePermission"("tenantId", "featureId");

-- AddForeignKey
ALTER TABLE "AccessFeature" ADD CONSTRAINT "AccessFeature_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFeaturePermission" ADD CONSTRAINT "UserFeaturePermission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFeaturePermission" ADD CONSTRAINT "UserFeaturePermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFeaturePermission" ADD CONSTRAINT "UserFeaturePermission_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "AccessFeature"("id") ON DELETE CASCADE ON UPDATE CASCADE;
