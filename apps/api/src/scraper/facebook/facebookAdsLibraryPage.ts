import type { Locator, Page } from "playwright";
import type { NormalizedAd } from "../../types/ad.js";

const LOAD_MORE_BUTTON_SELECTOR =
  'a[role="button"][tabindex="0"]:has(div[role="presentation"]):not([href])';

export async function triggerGraphqlPagination(
  page: Page,
  ads: Map<string, NormalizedAd>,
  limit: number,
  pendingResponseReads: Set<Promise<void>>,
) {
  let stalledAttempts = 0;
  let lastAdCount = ads.size;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    if (ads.size >= limit) {
      return;
    }

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);

    const button = await findLoadMoreButton(page);

    if (!button) {
      stalledAttempts += 1;
      if (stalledAttempts >= 3) {
        return;
      }
      continue;
    }

    await button.click();
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
    await page.waitForTimeout(1500);
    await Promise.allSettled(pendingResponseReads);

    if (ads.size === lastAdCount) {
      stalledAttempts += 1;
    } else {
      stalledAttempts = 0;
    }

    if (stalledAttempts >= 3) {
      return;
    }

    lastAdCount = ads.size;
  }
}

async function findLoadMoreButton(page: Page): Promise<Locator | null> {
  const candidates = page.locator(LOAD_MORE_BUTTON_SELECTOR);
  const candidateCount = await candidates.count();

  for (let index = candidateCount - 1; index >= 0; index -= 1) {
    const candidate = candidates.nth(index);
    const box = await candidate.boundingBox();
    const viewport = page.viewportSize();

    if (!box || !viewport) {
      continue;
    }

    const isFullWidth = box.width >= viewport.width * 0.8;
    const isNearPageBottom = box.y >= viewport.height * 0.65;
    const labelLength = (await candidate.innerText().catch(() => "")).trim().length;

    if (isFullWidth && isNearPageBottom && labelLength <= 40) {
      return candidate;
    }
  }

  return null;
}
