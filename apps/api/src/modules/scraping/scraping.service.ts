import { ScrapeStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { upsertAds } from "../ads/ads.repository.js";
import { scrapeNikeAds } from "../../scraper/facebookAdsLibraryScraper.js";

let activeRunId: string | null = null;

export async function startScrapeRun() {
  if (activeRunId) {
    return prisma.scrapeRun.findUniqueOrThrow({ where: { id: activeRunId } });
  }

  const run = await prisma.scrapeRun.create({
    data: { status: ScrapeStatus.RUNNING },
  });

  activeRunId = run.id;
  void executeScrapeRun(run.id);

  return run;
}

export async function getLatestScrapeRun() {
  return prisma.scrapeRun.findFirst({
    orderBy: { startedAt: "desc" },
  });
}

export async function getScrapeRun(id: string) {
  return prisma.scrapeRun.findUniqueOrThrow({ where: { id } });
}

async function executeScrapeRun(runId: string) {
  try {
    const ads = await scrapeNikeAds({ limit: 50 });
    await upsertAds(ads);

    await prisma.scrapeRun.update({
      where: { id: runId },
      data: {
        status: ScrapeStatus.SUCCESS,
        adsFound: ads.length,
        finishedAt: new Date(),
      },
    });
  } catch (error) {
    await prisma.scrapeRun.update({
      where: { id: runId },
      data: {
        status: ScrapeStatus.FAILED,
        error: error instanceof Error ? error.message : "Unknown scrape error",
        finishedAt: new Date(),
      },
    });
  } finally {
    activeRunId = null;
  }
}
