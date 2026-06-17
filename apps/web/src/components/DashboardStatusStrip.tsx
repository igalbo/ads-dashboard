import { LoaderCircle, RefreshCw } from "lucide-react";
import { ScrapeRun } from "../api/client";
import { formatDateTime } from "../utils/dates";
import { Metric } from "./Metric";

type Props = {
  adsTotal: number;
  isScrapePending: boolean;
  isScraping: boolean;
  onRunScrape: () => void | Promise<void>;
  scrapeRun: ScrapeRun | null;
};

export function DashboardStatusStrip({ adsTotal, isScrapePending, isScraping, onRunScrape, scrapeRun }: Props) {
  return (
    <section className="status-strip">
      <Metric label="Total Ads" value={adsTotal.toString()} />
      <Metric label="Latest scrape" value={scrapeRun?.status ?? "Not run"} isActive={isScraping} />
      <Metric label="Last Scrape Ads Found" value={scrapeRun ? scrapeRun.adsFound.toString() : "0"} />
      <Metric
        action={
          <button
            aria-label="Scrape now"
            className="metric-action-button"
            disabled={isScrapePending}
            onClick={() => void onRunScrape()}
            title="Scrape now"
            type="button"
          >
            {isScrapePending ? <LoaderCircle className="spinner" size={17} /> : <RefreshCw size={17} />}
            <span className="button-tooltip">Scrape now</span>
          </button>
        }
        label="Last Scrape"
        value={scrapeRun ? formatDateTime(scrapeRun.startedAt) : "-"}
      />
    </section>
  );
}
