-- CreateEnum
CREATE TYPE "SyncJobStatus" AS ENUM ('RUNNING', 'SUCCESS', 'PARTIAL_FAIL', 'FAIL');

-- CreateTable
CREATE TABLE "SyncJobLog" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "jobName" TEXT NOT NULL,
    "windowLabel" TEXT,
    "windowFrom" TIMESTAMP(3),
    "windowTo" TIMESTAMP(3),
    "status" "SyncJobStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "pages" INTEGER NOT NULL DEFAULT 0,
    "fetchedCount" INTEGER NOT NULL DEFAULT 0,
    "syncedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    CONSTRAINT "SyncJobLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SyncJobLog_jobName_startedAt_idx" ON "SyncJobLog" ("jobName", "startedAt");

-- CreateIndex
CREATE INDEX "SyncJobLog_status_createdAt_idx" ON "SyncJobLog" ("status", "createdAt");