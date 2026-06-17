import { describe, expect, it } from "vitest";
import { extractGraphqlPage } from "./facebookGraphqlParser.js";

describe("extractGraphqlPage", () => {
  it("extracts collated ads and page info from newline-delimited GraphQL payloads", () => {
    const payload = [
      JSON.stringify({
        data: {
          ad_library_main: {
            search_results_connection: {
              page_info: {
                end_cursor: "next-cursor",
                has_next_page: true,
              },
              edges: [
                {
                  node: {
                    collated_results: [
                      {
                        ad_archive_id: "ad-1",
                        is_active: true,
                        publisher_platform: ["FACEBOOK", "INSTAGRAM"],
                        start_date: 1_700_000_000,
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      }),
      "not json",
    ].join("\n");

    const page = extractGraphqlPage(payload);

    expect(page).toMatchObject({
      endCursor: "next-cursor",
      hasNextPage: true,
      rateLimited: false,
    });
    expect(page.ads).toHaveLength(1);
    expect(page.ads[0]).toMatchObject({
      id: "ad-1",
      platforms: ["FACEBOOK", "INSTAGRAM"],
    });
  });

  it("keeps parsing when a response contains a rate limit error line", () => {
    const payload = [
      JSON.stringify({
        errors: [{ message: "Rate limit exceeded" }],
      }),
      JSON.stringify({
        data: {
          ad_library_main: {
            search_results_connection: {
              edges: [
                {
                  node: {
                    collated_results: [{ ad_archive_id: "ad-2", is_active: false }],
                  },
                },
              ],
            },
          },
        },
      }),
    ].join("\n");

    const page = extractGraphqlPage(payload);

    expect(page.rateLimited).toBe(true);
    expect(page.ads.map((ad) => ad.id)).toEqual(["ad-2"]);
  });
});
