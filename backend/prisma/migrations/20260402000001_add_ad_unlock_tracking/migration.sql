-- Track ad unlock usage server-side to prevent client spoofing
ALTER TABLE "User" ADD COLUMN "adUnlocksToday" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "adUnlockDate" TEXT;
