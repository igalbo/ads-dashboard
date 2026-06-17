import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getLatestScrapeRun, getScrapeRun, startScrapeRun } from "./scraping.service.js";

const paramsSchema = z.object({
  id: z.string(),
});

export async function registerScrapingRoutes(app: FastifyInstance) {
  app.post("/", async () => startScrapeRun());

  app.get("/latest", async () => getLatestScrapeRun());

  app.get("/:id", async (request) => {
    const params = paramsSchema.parse(request.params);
    return getScrapeRun(params.id);
  });
}
