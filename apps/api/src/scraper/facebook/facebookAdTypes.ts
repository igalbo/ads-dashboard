import type { NormalizedAd } from "../../types/ad.js";

export type RawFacebookAd = {
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

export type GraphqlPage = {
  ads: NormalizedAd[];
  endCursor: string | null;
  hasNextPage: boolean;
  rateLimited: boolean;
};

export type AssetCandidate = {
  type: "image" | "video";
  url?: string | null;
};
