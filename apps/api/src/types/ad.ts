import type { AdStatus, Prisma } from "@prisma/client";

export type NormalizedAd = {
  id: string;
  status: AdStatus;
  platforms: string[];
  startDate: Date | null;
  endDate: Date | null;
  assetUrl: string | null;
  assetType: string | null;
  rawData: Prisma.InputJsonValue;
};
