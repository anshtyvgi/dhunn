-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('DEDICATE', 'STUDIO');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('QUEUED', 'PROCESSING_PROMPT', 'PROCESSING_ASSETS', 'PARTIAL', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "SongStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEBIT', 'CREDIT', 'REFUND', 'PURCHASE');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ShareVisibility" AS ENUM ('PRIVATE', 'PUBLIC_PREVIEW', 'PUBLIC_UNLOCKED');

-- CreateEnum
CREATE TYPE "ShareStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "imageUrl" TEXT,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "onboardingRewarded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "SessionType" NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'QUEUED',
    "prompt" JSONB,
    "input" JSONB NOT NULL,
    "tags" TEXT[],
    "coinCost" INTEGER NOT NULL,
    "failedReason" TEXT,
    "refundedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GenerationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Song" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "variantIndex" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "vibe" TEXT,
    "lyrics" TEXT NOT NULL,
    "tags" TEXT[],
    "prompt" TEXT,
    "status" "SongStatus" NOT NULL DEFAULT 'PENDING',
    "coverStatus" "AssetStatus" NOT NULL DEFAULT 'PENDING',
    "wanTaskId" TEXT,
    "audioUrl" TEXT,
    "audioStorageKey" TEXT,
    "coverImageUrl" TEXT,
    "coverStorageKey" TEXT,
    "durationSeconds" INTEGER,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "externalRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Share" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "visibility" "ShareVisibility" NOT NULL DEFAULT 'PRIVATE',
    "status" "ShareStatus" NOT NULL DEFAULT 'ACTIVE',
    "previewSecs" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Share_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "GenerationSession_userId_createdAt_idx" ON "GenerationSession"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "GenerationSession_status_createdAt_idx" ON "GenerationSession"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Song_sessionId_status_idx" ON "Song"("sessionId", "status");

-- CreateIndex
CREATE INDEX "Song_publishedAt_idx" ON "Song"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Song_sessionId_variantIndex_key" ON "Song"("sessionId", "variantIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_externalRef_key" ON "Transaction"("externalRef");

-- CreateIndex
CREATE INDEX "Transaction_userId_createdAt_idx" ON "Transaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_sessionId_createdAt_idx" ON "Transaction"("sessionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Share_slug_key" ON "Share"("slug");

-- CreateIndex
CREATE INDEX "Share_ownerId_createdAt_idx" ON "Share"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "Share_visibility_status_createdAt_idx" ON "Share"("visibility", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "GenerationSession" ADD CONSTRAINT "GenerationSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Song" ADD CONSTRAINT "Song_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GenerationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GenerationSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Share" ADD CONSTRAINT "Share_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Share" ADD CONSTRAINT "Share_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
