import { LoaderCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { Ad } from "../api/client";
import { formatDate, formatEndDate } from "../utils/dates";
import { AssetCell } from "./AssetCell";
import { PlatformList } from "./PlatformList";

type Props = {
  ads: Ad[];
  hasMoreAds: boolean;
  isLoadingMoreAds: boolean;
  onLoadMoreAds: () => void;
  total: number;
};

export function AdsTable({ ads, hasMoreAds, isLoadingMoreAds, onLoadMoreAds, total }: Props) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMoreAds || isLoadingMoreAds) {
      return;
    }

    const target = loadMoreRef.current;

    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLoadMoreAds();
        }
      },
      { rootMargin: "240px" },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [hasMoreAds, isLoadingMoreAds, onLoadMoreAds]);

  if (ads.length === 0) {
    return <p className="muted">No ads yet. Run the scraper to populate the dashboard.</p>;
  }

  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Asset</th>
              <th>Ad ID</th>
              <th>Status</th>
              <th>Platforms</th>
              <th>Start</th>
              <th>End</th>
            </tr>
          </thead>
          <tbody>
            {ads.map((ad) => (
              <tr key={ad.id}>
                <td>
                  <AssetCell ad={ad} />
                </td>
                <td>{ad.id}</td>
                <td>
                  <span className={`badge ${ad.status.toLowerCase()}`}>{ad.status}</span>
                </td>
                <td>
                  <PlatformList platforms={ad.platforms} />
                </td>
                <td>{formatDate(ad.startDate)}</td>
                <td>{formatEndDate(ad)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="infinite-scroll-status" ref={loadMoreRef}>
        {hasMoreAds ? (
          <>
            <LoaderCircle className="spinner" size={16} />
            {isLoadingMoreAds ? "Loading more ads" : "Scroll for more ads"}
          </>
        ) : (
          `Showing all ${total} ads`
        )}
      </div>
    </>
  );
}
