import { AdStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import type { NormalizedAd } from "../../types/ad.js";
import type { AssetCandidate, RawFacebookAd } from "./facebookAdTypes.js";

export function normalizeFacebookAd(rawAd: RawFacebookAd): NormalizedAd | null {
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
    endDate: rawAd.is_active ? null : unixSecondsToDate(rawAd.end_date),
    assetUrl: asset.url,
    assetType: asset.type,
    rawData: rawAd as Prisma.InputJsonValue,
  };
}

function getPrimaryAsset(rawAd: RawFacebookAd) {
  const video = rawAd.snapshot?.videos?.[0];
  const image = rawAd.snapshot?.images?.[0];
  const cardAssets =
    rawAd.snapshot?.cards?.flatMap((card): AssetCandidate[] => [
      { type: "video", url: card.video_hd_url },
      { type: "video", url: card.video_sd_url },
      { type: "image", url: card.video_preview_image_url },
      { type: "image", url: card.original_image_url },
      { type: "image", url: card.resized_image_url },
    ]) ?? [];

  const asset = [
    { type: "video", url: video?.video_hd_url },
    { type: "video", url: video?.video_sd_url },
    { type: "image", url: video?.video_preview_image_url },
    { type: "image", url: image?.original_image_url },
    { type: "image", url: image?.resized_image_url },
    ...cardAssets,
  ].find((candidate): candidate is Required<AssetCandidate> => Boolean(candidate.url));

  return asset ?? { type: null, url: null };
}

function unixSecondsToDate(value?: number) {
  return value ? new Date(value * 1000) : null;
}
