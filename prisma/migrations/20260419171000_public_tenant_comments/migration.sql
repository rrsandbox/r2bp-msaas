-- CreateTable
CREATE TABLE "PublicTenantComment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicTenantComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PublicTenantComment_createdAt_idx" ON "PublicTenantComment"("createdAt");

-- CreateIndex
CREATE INDEX "PublicTenantComment_tenantId_createdAt_idx" ON "PublicTenantComment"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "PublicTenantComment_userId_createdAt_idx" ON "PublicTenantComment"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "PublicTenantComment" ADD CONSTRAINT "PublicTenantComment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicTenantComment" ADD CONSTRAINT "PublicTenantComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
