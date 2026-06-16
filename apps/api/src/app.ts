import cors from "@fastify/cors";
import Fastify from "fastify";
import { env } from "./config/env.js";
import { registerAdsRoutes } from "./modules/ads/ads.routes.js";
import { registerScrapingRoutes } from "./modules/scraping/scraping.routes.js";

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.register(cors, {
    origin: [env.FRONTEND_ORIGIN],
  });

  app.get("/health", async () => ({ ok: true }));
  app.register(registerAdsRoutes, { prefix: "/ads" });
  app.register(registerScrapingRoutes, { prefix: "/scrapes" });

  return app;
}
