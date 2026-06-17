import { chromium } from "playwright";
import { env } from "../config/env.js";
import type { NormalizedAd } from "../types/ad.js";
import { triggerGraphqlPagination } from "./facebook/facebookAdsLibraryPage.js";
import { extractGraphqlPage } from "./facebook/facebookGraphqlParser.js";

type ScrapeOptions = {
  limit: number;
};

export async function scrapeNikeAds(options: ScrapeOptions): Promise<NormalizedAd[]> {
  const browser = await chromium.launch({
    headless: true,
  });
  const ads = new Map<string, NormalizedAd>();
  const pendingResponseReads = new Set<Promise<void>>();

  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 1200 },
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
    });

    page.on("response", (response) => {
      if (!response.url().includes("/api/graphql")) {
        return;
      }

      const postData = response.request().postData() ?? "";

      if (!postData.includes("AdLibrarySearchPaginationQuery")) {
        return;
      }

      const readResponse = response
        .text()
        .then((body) => {
          const parsed = extractGraphqlPage(body);

          addAdsToMap(ads, parsed.ads);
        })
        .catch(() => undefined);

      pendingResponseReads.add(readResponse);
      readResponse.finally(() => pendingResponseReads.delete(readResponse));
    });

    await page.goto(env.FACEBOOK_ADS_LIBRARY_URL, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    await page.waitForTimeout(3000);
    await Promise.allSettled(pendingResponseReads);

    await triggerGraphqlPagination(page, ads, options.limit, pendingResponseReads);

    return [...ads.values()].slice(0, options.limit);
  } finally {
    await browser.close();
  }
}

function addAdsToMap(ads: Map<string, NormalizedAd>, nextAds: NormalizedAd[]) {
  for (const ad of nextAds) {
    ads.set(ad.id, ad);
  }
}
