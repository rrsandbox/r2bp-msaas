-- CreateEnum
CREATE TYPE "TenantRegistrationStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('APPROVE_TENANT_REGISTRATION', 'REVIEW_TENANT_ONBOARDING', 'REVIEW_TENANT_USERS', 'REVIEW_SUPPORT_TICKET', 'SYSTEM_ADMIN');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserStatus" ADD VALUE 'PENDING_APPROVAL';
ALTER TYPE "UserStatus" ADD VALUE 'INACTIVE';
ALTER TYPE "UserStatus" ADD VALUE 'DELETED';

-- DropIndex
DROP INDEX "AccessFeature_tenantId_showInDashboard_idx";

-- DropIndex
DROP INDEX "AccessFeature_tenantId_showInMenu_idx";

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "adminProfile" JSONB,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "billingProfile" JSONB,
ADD COLUMN     "legalProfile" JSONB,
ADD COLUMN     "onboardingStatus" "OnboardingStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "anonymizedAt" TIMESTAMP(3),
ADD COLUMN     "deactivatedAt" TIMESTAMP(3),
ADD COLUMN     "isProfileComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profile" JSONB,
ADD COLUMN     "profileCompletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "TenantRegistrationRequest" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "requestedTenantName" TEXT,
    "requestedTenantSlug" TEXT,
    "status" "TenantRegistrationStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "reviewNotes" TEXT,
    "reviewerId" TEXT,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),

    CONSTRAINT "TenantRegistrationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantUserInvite" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "RoleKey" NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "tokenHash" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "acceptedUserId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantUserInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdministrativeTask" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "type" "TaskType" NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "payload" JSONB,
    "assignedToId" TEXT,
    "createdById" TEXT,
    "dueAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdministrativeTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemNotice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemNotice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TenantRegistrationRequest_status_createdAt_idx" ON "TenantRegistrationRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "TenantRegistrationRequest_email_status_idx" ON "TenantRegistrationRequest"("email", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TenantUserInvite_tokenHash_key" ON "TenantUserInvite"("tokenHash");

-- CreateIndex
CREATE INDEX "TenantUserInvite_tenantId_status_idx" ON "TenantUserInvite"("tenantId", "status");

-- CreateIndex
CREATE INDEX "TenantUserInvite_email_status_idx" ON "TenantUserInvite"("email", "status");

-- CreateIndex
CREATE INDEX "AdministrativeTask_tenantId_status_type_idx" ON "AdministrativeTask"("tenantId", "status", "type");

-- CreateIndex
CREATE INDEX "AdministrativeTask_assignedToId_status_idx" ON "AdministrativeTask"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "SystemNotice_tenantId_isActive_idx" ON "SystemNotice"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "SupportTicket_tenantId_status_priority_idx" ON "SupportTicket"("tenantId", "status", "priority");

-- CreateIndex
CREATE INDEX "SupportTicket_requesterId_status_idx" ON "SupportTicket"("requesterId", "status");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantRegistrationRequest" ADD CONSTRAINT "TenantRegistrationRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantRegistrationRequest" ADD CONSTRAINT "TenantRegistrationRequest_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantUserInvite" ADD CONSTRAINT "TenantUserInvite_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantUserInvite" ADD CONSTRAINT "TenantUserInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantUserInvite" ADD CONSTRAINT "TenantUserInvite_acceptedUserId_fkey" FOREIGN KEY ("acceptedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdministrativeTask" ADD CONSTRAINT "AdministrativeTask_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdministrativeTask" ADD CONSTRAINT "AdministrativeTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdministrativeTask" ADD CONSTRAINT "AdministrativeTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemNotice" ADD CONSTRAINT "SystemNotice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
