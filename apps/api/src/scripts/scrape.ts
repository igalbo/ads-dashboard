import { prisma } from "../lib/prisma.js";
import { upsertAds } from "../modules/ads/ads.repository.js";
import { scrapeNikeAds } from "../scraper/facebookAdsLibraryScraper.js";

const ads = await scrapeNikeAds({ limit: 50 });
await upsertAds(ads);

console.log(`Saved ${ads.length} ads`);
await prisma.$disconnect();
