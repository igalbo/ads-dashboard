import { Ad } from "../api/client";
import { AdsTable } from "./AdsTable";

type Props = {
  ads: Ad[];
  hasMoreAds: boolean;
  isLoading: boolean;
  isLoadingMoreAds: boolean;
  onLoadMoreAds: () => void;
  total: number;
};

export function AdsSection({ ads, hasMoreAds, isLoading, isLoadingMoreAds, onLoadMoreAds, total }: Props) {
  return (
    <section className="ads-section">
      <h2>Scraped Ads</h2>
      {isLoading ? (
        <p className="muted">Loading ads...</p>
      ) : (
        <AdsTable
          ads={ads}
          hasMoreAds={hasMoreAds}
          isLoadingMoreAds={isLoadingMoreAds}
          onLoadMoreAds={onLoadMoreAds}
          total={total}
        />
      )}
    </section>
  );
}
