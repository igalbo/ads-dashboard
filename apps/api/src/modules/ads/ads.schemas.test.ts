import { AdStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { parseAdsQuery, parseFilters } from "./ads.schemas.js";

describe("ads schemas", () => {
  it("parses pagination and repeated platform filters", () => {
    const parsed = parseAdsQuery({
      platform: ["FACEBOOK", "INSTAGRAM"],
      limit: "24",
      offset: "12",
      status: AdStatus.ACTIVE,
    });

    expect(parsed).toEqual({
      filters: {
        from: undefined,
        to: undefined,
        status: AdStatus.ACTIVE,
        platforms: ["FACEBOOK", "INSTAGRAM"],
      },
      page: {
        limit: 24,
        offset: 12,
      },
    });
  });

  it("normalizes a single platform query param", () => {
    expect(parseFilters({ platform: "MESSENGER" })).toMatchObject({
      platforms: ["MESSENGER"],
    });
  });
});
