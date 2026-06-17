import { AdsChart } from "./components/AdsChart";
import { AdsSection } from "./components/AdsSection";
import { DashboardFilters } from "./components/DashboardFilters";
import { DashboardHeader } from "./components/DashboardHeader";
import { DashboardStatusStrip } from "./components/DashboardStatusStrip";
import { ErrorMessage } from "./components/ErrorMessage";
import { ScrapeStatusNotice } from "./components/ScrapeStatusNotice";
import { useDashboardData } from "./hooks/useDashboardData";

export function App() {
  const {
    ads,
    adsTotal,
    error,
    filters,
    hasMoreAds,
    isLoading,
    isLoadingMoreAds,
    isScrapePending,
    isScraping,
    isStartingScrape,
    loadMoreAds,
    platformOptions,
    runScrape,
    scrapeRun,
    setFilters,
    summary,
  } = useDashboardData();

  return (
    <main className="dashboard">
      <DashboardHeader />
      <DashboardStatusStrip
        adsTotal={adsTotal}
        isScrapePending={isScrapePending}
        isScraping={isScraping}
        onRunScrape={runScrape}
        scrapeRun={scrapeRun}
      />
      <ScrapeStatusNotice isStartingScrape={isStartingScrape} isVisible={isScrapePending} />
      <DashboardFilters filters={filters} onChange={setFilters} platformOptions={platformOptions} />
      <ErrorMessage message={error} />
      <AdsChart summary={summary} />
      <AdsSection
        ads={ads}
        hasMoreAds={hasMoreAds}
        isLoading={isLoading}
        isLoadingMoreAds={isLoadingMoreAds}
        onLoadMoreAds={loadMoreAds}
        total={adsTotal}
      />
    </main>
  );
}
