/*
  Warnings:

  - A unique constraint covering the columns `[calendarSyncToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "RecurrenceFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "AgendaEvent" ADD COLUMN     "isRecurringRoot" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recurrenceCount" INTEGER,
ADD COLUMN     "recurrenceFrequency" "RecurrenceFrequency",
ADD COLUMN     "recurrenceInterval" INTEGER,
ADD COLUMN     "recurrenceUntil" TIMESTAMP(3),
ADD COLUMN     "seriesId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "calendarSyncToken" TEXT;

-- CreateIndex
CREATE INDEX "AgendaEvent_seriesId_idx" ON "AgendaEvent"("seriesId");

-- CreateIndex
CREATE UNIQUE INDEX "User_calendarSyncToken_key" ON "User"("calendarSyncToken");
