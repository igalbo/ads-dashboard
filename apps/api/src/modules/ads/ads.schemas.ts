import { AdStatus } from "@prisma/client";
import { z } from "zod";

const DEFAULT_ADS_PAGE_SIZE = 12;
const MAX_ADS_PAGE_SIZE = 50;

const adsQuerySchema = z.object({
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  status: z.nativeEnum(AdStatus).optional(),
  platform: z.union([z.string(), z.array(z.string())]).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_ADS_PAGE_SIZE).default(DEFAULT_ADS_PAGE_SIZE),
  offset: z.coerce.number().int().min(0).default(0),
});

export function parseFilters(query: unknown) {
  const parsed = adsQuerySchema.parse(query);

  return filtersFromParsedQuery(parsed);
}

export function parseAdsQuery(query: unknown) {
  const parsed = adsQuerySchema.parse(query);

  return {
    filters: filtersFromParsedQuery(parsed),
    page: {
      limit: parsed.limit,
      offset: parsed.offset,
    },
  };
}

function filtersFromParsedQuery(parsed: z.infer<typeof adsQuerySchema>) {
  return {
    from: parsed.from ? new Date(parsed.from) : undefined,
    to: parsed.to ? new Date(parsed.to) : undefined,
    status: parsed.status,
    platforms: normalizePlatforms(parsed.platform),
  };
}

function normalizePlatforms(platforms?: string | string[]) {
  if (!platforms) {
    return undefined;
  }

  return (Array.isArray(platforms) ? platforms : [platforms]).filter(Boolean);
}
