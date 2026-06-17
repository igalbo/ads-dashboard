import { normalizeFacebookAd } from "./facebookAdNormalizer.js";
import type { GraphqlPage, RawFacebookAd } from "./facebookAdTypes.js";

export function extractGraphqlPage(responseBody: string): GraphqlPage {
  const ads: GraphqlPage["ads"] = [];
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
