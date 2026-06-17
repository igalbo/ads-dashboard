import type { AdStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type { NormalizedAd } from "../../types/ad.js";

export type AdFilters = {
  from?: Date;
  to?: Date;
  status?: AdStatus;
  platforms?: string[];
};

export type AdPageOptions = {
  limit: number;
  offset: number;
};

export async function listAds(filters: AdFilters) {
  return prisma.ad.findMany({
    where: buildWhere(filters),
    orderBy: getAdOrderBy(),
  });
}

export async function listAdsPage(filters: AdFilters, options: AdPageOptions) {
  const take = options.limit + 1;
  const where = buildWhere(filters);
  const [ads, total] = await prisma.$transaction([
    prisma.ad.findMany({
      where,
      orderBy: getAdOrderBy(),
      skip: options.offset,
      take,
    }),
    prisma.ad.count({ where }),
  ]);
  const items = ads.slice(0, options.limit);
  const hasNextPage = ads.length > options.limit;

  return {
    items,
    nextOffset: hasNextPage ? options.offset + items.length : null,
    total,
  };
}

export async function getAdsFacets() {
  const ads = await prisma.ad.findMany({
    select: {
      platforms: true,
      status: true,
    },
  });

  return {
    platforms: [...new Set(ads.flatMap((ad) => ad.platforms))].sort(),
    statuses: [...new Set(ads.map((ad) => ad.status))].sort(),
  };
}

export async function upsertAds(ads: NormalizedAd[]) {
  for (const ad of ads) {
    await prisma.ad.upsert({
      where: { id: ad.id },
      create: ad,
      update: {
        status: ad.status,
        platforms: ad.platforms,
        startDate: ad.startDate,
        endDate: ad.endDate,
        assetUrl: ad.assetUrl,
        assetType: ad.assetType,
        rawData: ad.rawData,
      },
    });
  }
}

function buildWhere(filters: AdFilters): Prisma.AdWhereInput {
  return {
    status: filters.status,
    platforms: filters.platforms?.length ? { hasSome: filters.platforms } : undefined,
    startDate:
      filters.from || filters.to
        ? {
            gte: filters.from,
            lte: filters.to,
          }
        : undefined,
  };
}

function getAdOrderBy(): Prisma.AdOrderByWithRelationInput[] {
  return [{ startDate: "desc" }, { updatedAt: "desc" }, { id: "desc" }];
}
