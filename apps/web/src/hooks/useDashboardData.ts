import { useCallback, useEffect, useState } from "react";
import {
  Ad,
  AdFilters,
  getAds,
  getAdsFacets,
  getAdsSummary,
  getLatestScrape,
  ScrapeRun,
  startScrape,
  SummaryPoint,
} from "../api/client";
import { sortPlatformOptions } from "../utils/platforms";

const ADS_PAGE_SIZE = 12;

export function useDashboardData() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [adsTotal, setAdsTotal] = useState(0);
  const [nextAdsOffset, setNextAdsOffset] = useState<number | null>(null);
  const [platformOptions, setPlatformOptions] = useState<string[]>([]);
  const [summary, setSummary] = useState<SummaryPoint[]>([]);
  const [scrapeRun, setScrapeRun] = useState<ScrapeRun | null>(null);
  const [filters, setFilters] = useState<AdFilters>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMoreAds, setIsLoadingMoreAds] = useState(false);
  const [isStartingScrape, setIsStartingScrape] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);

    try {
      const [nextAdsPage, nextSummary, latestScrape, nextFacets] = await Promise.all([
        getAds(filters, { limit: ADS_PAGE_SIZE }),
        getAdsSummary(filters),
        getLatestScrape(),
        getAdsFacets(),
      ]);

      setAds(nextAdsPage.items);
      setAdsTotal(nextAdsPage.total);
      setNextAdsOffset(nextAdsPage.nextOffset);
      setSummary(nextSummary);
      setScrapeRun(latestScrape);
      setPlatformOptions(sortPlatformOptions(nextFacets.platforms));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const loadMoreAds = useCallback(async () => {
    if (nextAdsOffset === null || isLoadingMoreAds) {
      return;
    }

    setIsLoadingMoreAds(true);
    setError(null);

    try {
      const nextAdsPage = await getAds(filters, {
        limit: ADS_PAGE_SIZE,
        offset: nextAdsOffset,
      });

      setAds((currentAds) => [...currentAds, ...nextAdsPage.items]);
      setAdsTotal(nextAdsPage.total);
      setNextAdsOffset(nextAdsPage.nextOffset);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load more ads");
    } finally {
      setIsLoadingMoreAds(false);
    }
  }, [filters, isLoadingMoreAds, nextAdsOffset]);

  const runScrape = useCallback(async () => {
    setError(null);
    setIsStartingScrape(true);

    try {
      const run = await startScrape();
      setScrapeRun(run);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to start scraper");
    } finally {
      setIsStartingScrape(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (scrapeRun?.status !== "RUNNING") {
      return;
    }

    const interval = window.setInterval(() => {
      void refresh();
    }, 2500);

    return () => window.clearInterval(interval);
  }, [scrapeRun?.status, refresh]);

  const isScraping = scrapeRun?.status === "RUNNING";

  return {
    ads,
    adsTotal,
    error,
    filters,
    hasMoreAds: nextAdsOffset !== null,
    isLoading,
    isLoadingMoreAds,
    isScrapePending: isStartingScrape || isScraping,
    isScraping,
    isStartingScrape,
    loadMoreAds,
    platformOptions,
    runScrape,
    scrapeRun,
    setFilters,
    summary,
  };
}
