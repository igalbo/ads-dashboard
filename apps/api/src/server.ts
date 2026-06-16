import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

const app = buildApp();

try {
  await app.listen({ host: "0.0.0.0", port: env.API_PORT });
} catch (error) {
  app.log.error(error);
  await prisma.$disconnect();
  process.exit(1);
}

process.on("SIGINT", async () => {
  await app.close();
  await prisma.$disconnect();
});

process.on("SIGTERM", async () => {
  await app.close();
  await prisma.$disconnect();
});
