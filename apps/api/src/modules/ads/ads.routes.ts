import type { FastifyInstance } from "fastify";
import { getAdsFacets, listAdsPage } from "./ads.repository.js";
import { parseAdsQuery, parseFilters } from "./ads.schemas.js";
import { getAdsSummary } from "./ads.summary.js";

export async function registerAdsRoutes(app: FastifyInstance) {
  app.get("/", async (request) => {
    const { filters, page } = parseAdsQuery(request.query);
    return listAdsPage(filters, page);
  });

  app.get("/facets", async () => getAdsFacets());

  app.get("/summary", async (request) => {
    const filters = parseFilters(request.query);
    return getAdsSummary(filters);
  });
}
