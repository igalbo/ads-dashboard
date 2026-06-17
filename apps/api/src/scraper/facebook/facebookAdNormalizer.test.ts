import { AdStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { normalizeFacebookAd } from "./facebookAdNormalizer.js";
import type { RawFacebookAd } from "./facebookAdTypes.js";

describe("normalizeFacebookAd", () => {
  it("marks active ads as still running", () => {
    const ad = normalizeFacebookAd({
      ad_archive_id: "active-ad",
      is_active: true,
      end_date: 1_700_000_000,
      publisher_platform: ["FACEBOOK"],
    });

    expect(ad).toMatchObject({
      id: "active-ad",
      status: AdStatus.ACTIVE,
      platforms: ["FACEBOOK"],
      endDate: null,
    });
  });

  it("uses the best video asset before image assets", () => {
    const rawAd: RawFacebookAd = {
      ad_archive_id: "video-ad",
      is_active: false,
      snapshot: {
        images: [{ original_image_url: "https://example.com/image.jpg" }],
        videos: [
          {
            video_hd_url: "https://example.com/video-hd.mp4",
            video_sd_url: "https://example.com/video-sd.mp4",
            video_preview_image_url: "https://example.com/preview.jpg",
          },
        ],
      },
    };

    expect(normalizeFacebookAd(rawAd)).toMatchObject({
      assetType: "video",
      assetUrl: "https://example.com/video-hd.mp4",
    });
  });

  it("returns null when Facebook does not provide an ad id", () => {
    expect(normalizeFacebookAd({ is_active: true })).toBeNull();
  });
});
