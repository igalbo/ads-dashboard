import { AdStatus, Prisma } from "@prisma/client";
import { chromium, Locator, Page, Request } from "playwright";
import { env } from "../config/env.js";
import { NormalizedAd } from "../modules/ads/ads.repository.js";

type ScrapeOptions = {
  limit: number;
};

const LOAD_MORE_BUTTON_SELECTOR =
  'a[role="button"][tabindex="0"]:has(div[role="presentation"]):not([href])';

type RawFacebookAd = {
  ad_archive_id?: string;
  ad_id?: string;
  is_active?: boolean;
  publisher_platform?: string[];
  start_date?: number;
  end_date?: number;
  snapshot?: {
    images?: Array<{ original_image_url?: string; resized_image_url?: string }>;
    videos?: Array<{
      video_hd_url?: string | null;
      video_sd_url?: string | null;
      video_preview_image_url?: string | null;
    }>;
    cards?: Array<{
      original_image_url?: string | null;
      resized_image_url?: string | null;
      video_hd_url?: string | null;
      video_sd_url?: string | null;
      video_preview_image_url?: string | null;
    }>;
    display_format?: string;
  };
};

type GraphqlRequestTemplate = {
  url: string;
  form: URLSearchParams;
  headers: Record<string, string>;
};

type GraphqlPage = {
  ads: NormalizedAd[];
  endCursor: string | null;
  hasNextPage: boolean;
  rateLimited: boolean;
};

export async function scrapeNikeAds(options: ScrapeOptions): Promise<NormalizedAd[]> {
  const browser = await chromium.launch({
    headless: true,
  });
  const ads = new Map<string, NormalizedAd>();
  const pendingResponseReads = new Set<Promise<void>>();
  let latestTemplate: GraphqlRequestTemplate | null = null;
  let latestCursor: string | null = null;
  let hasNextPage = true;

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
        .then(async (body) => {
          const parsed = extractGraphqlPage(body);

          addAdsToMap(ads, parsed.ads);

          latestCursor = parsed.endCursor ?? latestCursor;
          hasNextPage = parsed.hasNextPage;
          latestTemplate = await buildGraphqlRequestTemplate(response.request());
        })
        .catch(() => undefined);

      pendingResponseReads.add(readResponse);
      readResponse.finally(() => pendingResponseReads.delete(readResponse));
    });

    await page.goto(env.FACEBOOK_ADS_LIBRARY_URL, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    await dismissCookieDialog(page);
    await page.waitForTimeout(3000);
    await Promise.allSettled(pendingResponseReads);

    addAdsToMap(ads, extractAdsFromHtml(await page.content()));

    if ((!latestTemplate || !latestCursor) && ads.size < options.limit) {
      await triggerGraphqlPagination(page, pendingResponseReads);
      await Promise.allSettled(pendingResponseReads);
    }

    await fetchGraphqlPages(page, {
      ads,
      limit: options.limit,
      template: latestTemplate,
      cursor: latestCursor,
      hasNextPage,
    });

    return [...ads.values()].slice(0, options.limit);
  } finally {
    await browser.close();
  }
}

async function triggerGraphqlPagination(page: Page, pendingResponseReads: Set<Promise<void>>) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);

    const button = await findLoadMoreButton(page);

    if (!button) {
      continue;
    }

    await button.click();
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
    await page.waitForTimeout(1500);
    await Promise.allSettled(pendingResponseReads);
    return;
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

export function extractAdsFromHtml(html: string): NormalizedAd[] {
  const decodedHtml = decodeHtmlEntities(html);
  const rawAds = findJsonObjectsWithKey(decodedHtml, "ad_archive_id");
  const seen = new Set<string>();
  const ads: NormalizedAd[] = [];

  for (const rawAd of rawAds) {
    const normalized = normalizeFacebookAd(rawAd);

    if (!normalized || seen.has(normalized.id)) {
      continue;
    }

    seen.add(normalized.id);
    ads.push(normalized);
  }

  return ads;
}

async function dismissCookieDialog(page: Page) {
  const buttons = [
    page.getByRole("button", { name: /allow all cookies/i }),
    page.getByRole("button", { name: /accept all/i }),
    page.getByRole("button", { name: /decline optional cookies/i }),
  ];

  for (const button of buttons) {
    try {
      if (await button.isVisible({ timeout: 1500 })) {
        await button.click();
        return;
      }
    } catch {
      // Ignore missing cookie controls.
    }
  }
}

async function fetchGraphqlPages(
  page: Page,
  options: {
    ads: Map<string, NormalizedAd>;
    limit: number;
    template: GraphqlRequestTemplate | null;
    cursor: string | null;
    hasNextPage: boolean;
  },
) {
  let cursor = options.cursor;
  let hasNextPage = options.hasNextPage;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (!options.template || !cursor || !hasNextPage || options.ads.size >= options.limit) {
      return;
    }

    const pageResult = await fetchGraphqlPage(page, options.template, cursor, options.limit);
    addAdsToMap(options.ads, pageResult.ads);

    if (pageResult.rateLimited) {
      return;
    }

    cursor = pageResult.endCursor;
    hasNextPage = pageResult.hasNextPage;
  }
}

function addAdsToMap(ads: Map<string, NormalizedAd>, nextAds: NormalizedAd[]) {
  for (const ad of nextAds) {
    ads.set(ad.id, ad);
  }
}

async function buildGraphqlRequestTemplate(request: Request) {
  const headers = await request.allHeaders();

  return {
    url: request.url(),
    form: new URLSearchParams(request.postData() ?? ""),
    headers: pickReplayHeaders(headers),
  };
}

async function fetchGraphqlPage(
  page: Page,
  template: GraphqlRequestTemplate,
  cursor: string,
  limit: number,
): Promise<GraphqlPage> {
  const form = new URLSearchParams(template.form);
  const variables = JSON.parse(form.get("variables") ?? "{}") as Record<string, unknown>;

  variables.cursor = cursor;
  variables.first = Math.min(50, Math.max(10, limit));
  form.set("variables", JSON.stringify(variables));

  const response = await page.request.post(template.url, {
    data: form.toString(),
    headers: template.headers,
  });

  return extractGraphqlPage(await response.text());
}

function pickReplayHeaders(headers: Record<string, string>) {
  const allowedHeaders = [
    "accept",
    "accept-language",
    "content-type",
    "cookie",
    "origin",
    "referer",
    "user-agent",
    "x-asbd-id",
    "x-fb-friendly-name",
    "x-fb-lsd",
  ];

  return Object.fromEntries(
    allowedHeaders
      .map((header) => [header, headers[header]] as const)
      .filter((entry): entry is readonly [string, string] => Boolean(entry[1])),
  );
}

function extractGraphqlPage(responseBody: string): GraphqlPage {
  const ads: NormalizedAd[] = [];
  let endCursor: string | null = null;
  let hasNextPage = false;
  let rateLimited = false;

  for (const line of responseBody.split("\n")) {
    if (!line.trim()) {
      continue;
    }

    try {
      const payload = JSON.parse(line) as unknown;
      const pageInfo = extractGraphqlPageInfo(payload);
      const rawAds = extractRawAdsFromGraphqlPayload(payload);

      if (isRateLimitedGraphqlPayload(payload)) {
        rateLimited = true;
      }

      endCursor = pageInfo.endCursor ?? endCursor;
      hasNextPage = pageInfo.hasNextPage ?? hasNextPage;

      for (const rawAd of rawAds) {
        const normalized = normalizeFacebookAd(rawAd);

        if (normalized) {
          ads.push(normalized);
        }
      }
    } catch {
      // Ignore non-JSON chunks and GraphQL error payloads.
    }
  }

  return { ads, endCursor, hasNextPage, rateLimited };
}

function extractRawAdsFromGraphqlPayload(payload: unknown): RawFacebookAd[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const root = payload as {
    data?: {
      ad_library_main?: {
        search_results_connection?: {
          edges?: Array<{
            node?: {
              collated_results?: RawFacebookAd[];
            };
          }>;
        };
      };
    };
  };

  const edges = root.data?.ad_library_main?.search_results_connection?.edges ?? [];

  return edges.flatMap((edge) => edge.node?.collated_results ?? []);
}

function extractGraphqlPageInfo(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return { endCursor: null, hasNextPage: null };
  }

  const root = payload as {
    data?: {
      ad_library_main?: {
        search_results_connection?: {
          page_info?: {
            end_cursor?: string | null;
            has_next_page?: boolean | null;
          };
        };
      };
    };
  };

  const pageInfo = root.data?.ad_library_main?.search_results_connection?.page_info;

  return {
    endCursor: pageInfo?.end_cursor ?? null,
    hasNextPage: pageInfo?.has_next_page ?? null,
  };
}

function isRateLimitedGraphqlPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const root = payload as {
    errors?: Array<{ message?: string }>;
  };

  return root.errors?.some((error) => error.message?.includes("Rate limit exceeded")) ?? false;
}

function normalizeFacebookAd(rawAd: RawFacebookAd): NormalizedAd | null {
  const id = rawAd.ad_archive_id ?? rawAd.ad_id;

  if (!id) {
    return null;
  }

  const asset = getPrimaryAsset(rawAd);

  return {
    id,
    status: rawAd.is_active ? AdStatus.ACTIVE : AdStatus.INACTIVE,
    platforms: rawAd.publisher_platform ?? [],
    startDate: unixSecondsToDate(rawAd.start_date),
    endDate: unixSecondsToDate(rawAd.end_date),
    assetUrl: asset.url,
    assetType: asset.type,
    rawData: rawAd as Prisma.InputJsonValue,
  };
}

function getPrimaryAsset(rawAd: RawFacebookAd) {
  const video = rawAd.snapshot?.videos?.[0];
  const image = rawAd.snapshot?.images?.[0];
  const card = rawAd.snapshot?.cards?.find(
    (nextCard) =>
      nextCard.video_hd_url ||
      nextCard.video_sd_url ||
      nextCard.video_preview_image_url ||
      nextCard.original_image_url ||
      nextCard.resized_image_url,
  );

  if (video?.video_hd_url) {
    return { type: "video", url: video.video_hd_url };
  }

  if (video?.video_sd_url) {
    return { type: "video", url: video.video_sd_url };
  }

  if (video?.video_preview_image_url) {
    return { type: "image", url: video.video_preview_image_url };
  }

  if (image?.original_image_url) {
    return { type: "image", url: image.original_image_url };
  }

  if (image?.resized_image_url) {
    return { type: "image", url: image.resized_image_url };
  }

  if (card?.video_hd_url) {
    return { type: "video", url: card.video_hd_url };
  }

  if (card?.video_sd_url) {
    return { type: "video", url: card.video_sd_url };
  }

  if (card?.video_preview_image_url) {
    return { type: "image", url: card.video_preview_image_url };
  }

  if (card?.original_image_url) {
    return { type: "image", url: card.original_image_url };
  }

  if (card?.resized_image_url) {
    return { type: "image", url: card.resized_image_url };
  }

  return { type: null, url: null };
}

function unixSecondsToDate(value?: number) {
  return value ? new Date(value * 1000) : null;
}

function findJsonObjectsWithKey(html: string, key: string): RawFacebookAd[] {
  const objects: RawFacebookAd[] = [];
  const needle = `"${key}"`;
  let index = html.indexOf(needle);

  while (index !== -1) {
    const object = parseNearestJsonObject(html, index);

    if (object) {
      objects.push(object);
    }

    index = html.indexOf(needle, index + needle.length);
  }

  return objects;
}

function parseNearestJsonObject(text: string, keyIndex: number): RawFacebookAd | null {
  let start = keyIndex;

  for (let attempt = 0; attempt < 25; attempt += 1) {
    start = text.lastIndexOf("{", start - 1);

    if (start === -1) {
      return null;
    }

    const end = findJsonObjectEnd(text, start);

    if (end === -1) {
      continue;
    }

    try {
      const parsed = JSON.parse(text.slice(start, end + 1)) as RawFacebookAd;
      if (parsed.ad_archive_id || parsed.ad_id) {
        return parsed;
      }
    } catch {
      // Try a wider enclosing object.
    }
  }

  return null;
}

function findJsonObjectEnd(text: string, start: number) {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === "{") {
      depth += 1;
    }

    if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function decodeHtmlEntities(value: string) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&#34;", '"')
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}
