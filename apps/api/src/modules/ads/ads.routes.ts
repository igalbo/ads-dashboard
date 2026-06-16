import { AdStatus } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { getAdsSummary, listAds } from "./ads.repository.js";

const adsQuerySchema = z.object({
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  status: z.nativeEnum(AdStatus).optional(),
  platform: z.string().optional(),
});

export async function registerAdsRoutes(app: FastifyInstance) {
  app.get("/", async (request) => {
    const filters = parseFilters(request.query);
    return listAds(filters);
  });

  app.get("/summary", async (request) => {
    const filters = parseFilters(request.query);
    return getAdsSummary(filters);
  });
}

function parseFilters(query: unknown) {
  const parsed = adsQuerySchema.parse(query);

  return {
    from: parsed.from ? new Date(parsed.from) : undefined,
    to: parsed.to ? new Date(parsed.to) : undefined,
    status: parsed.status,
    platform: parsed.platform,
  };
}
