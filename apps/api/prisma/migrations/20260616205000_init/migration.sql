CREATE TYPE "AdStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "ScrapeStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');

CREATE TABLE "Ad" (
  "id" TEXT NOT NULL,
  "status" "AdStatus" NOT NULL,
  "platforms" TEXT[],
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "assetUrl" TEXT,
  "assetType" TEXT,
  "rawData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Ad_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScrapeRun" (
  "id" TEXT NOT NULL,
  "status" "ScrapeStatus" NOT NULL DEFAULT 'PENDING',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  "error" TEXT,
  "adsFound" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "ScrapeRun_pkey" PRIMARY KEY ("id")
);
