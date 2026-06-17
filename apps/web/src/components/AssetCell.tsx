import { Search } from "lucide-react";
import { Ad } from "../api/client";

type Props = {
  ad: Ad;
};

export function AssetCell({ ad }: Props) {
  if (!ad.assetUrl) {
    return <span className="asset-placeholder">No asset</span>;
  }

  const preview =
    ad.assetType === "video" ? (
      <video className="asset-preview" controls muted preload="metadata" src={ad.assetUrl} />
    ) : (
      <img alt={`Ad ${ad.id} preview`} className="asset-preview" loading="lazy" src={ad.assetUrl} />
    );

  if (ad.assetType === "video") {
    return (
      <span className="asset-preview-wrap">
        <video className="asset" controls muted preload="metadata" src={ad.assetUrl} />
        <span aria-label={`Preview ad ${ad.id}`} className="asset-zoom" tabIndex={0}>
          <Search size={14} />
          <span className="asset-popover">{preview}</span>
        </span>
      </span>
    );
  }

  return (
    <span className="asset-preview-wrap">
      <img alt={`Ad ${ad.id}`} className="asset" loading="lazy" src={ad.assetUrl} />
      <span aria-label={`Preview ad ${ad.id}`} className="asset-zoom" tabIndex={0}>
        <Search size={14} />
        <span className="asset-popover">{preview}</span>
      </span>
    </span>
  );
}
