import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Play, RefreshCw } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Ad,
  AdFilters,
  getAds,
  getAdsSummary,
  getLatestScrape,
  ScrapeRun,
  startScrape,
  SummaryPoint,
} from "./api/client";

export function App() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [summary, setSummary] = useState<SummaryPoint[]>([]);
  const [scrapeRun, setScrapeRun] = useState<ScrapeRun | null>(null);
  const [filters, setFilters] = useState<AdFilters>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setError(null);

    try {
      const [nextAds, nextSummary, latestScrape] = await Promise.all([
        getAds(filters),
        getAdsSummary(filters),
        getLatestScrape(),
      ]);

      setAds(nextAds);
      setSummary(nextSummary);
      setScrapeRun(latestScrape);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }

  async function runScrape() {
    setError(null);

    try {
      const run = await startScrape();
      setScrapeRun(run);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to start scraper");
    }
  }

  useEffect(() => {
    void refresh();
  }, [filters]);

  useEffect(() => {
    if (scrapeRun?.status !== "RUNNING") {
      return;
    }

    const interval = window.setInterval(() => {
      void refresh();
    }, 2500);

    return () => window.clearInterval(interval);
  }, [scrapeRun?.status, filters]);

  const platforms = useMemo(() => {
    return [...new Set(ads.flatMap((ad) => ad.platforms))].sort();
  }, [ads]);

  return (
    <main className="dashboard">
      <section className="topbar">
        <div>
          <p className="eyebrow">Nike Ads Library</p>
          <h1>Ads Scraping Dashboard</h1>
        </div>
        <div className="actions">
          <button className="icon-button secondary" type="button" onClick={() => void refresh()} title="Refresh">
            <RefreshCw size={18} />
          </button>
          <button className="primary-button" type="button" onClick={() => void runScrape()}>
            <Play size={18} />
            Run scrape
          </button>
        </div>
      </section>

      <section className="status-strip">
        <Metric label="Ads" value={ads.length.toString()} />
        <Metric label="Latest scrape" value={scrapeRun?.status ?? "Not run"} />
        <Metric label="Found" value={scrapeRun ? scrapeRun.adsFound.toString() : "0"} />
        <Metric label="Started" value={scrapeRun ? formatDateTime(scrapeRun.startedAt) : "-"} />
      </section>

      <section className="filters">
        <label>
          <CalendarDays size={16} />
          From
          <input
            type="date"
            value={filters.from ?? ""}
            onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
          />
        </label>
        <label>
          <CalendarDays size={16} />
          To
          <input
            type="date"
            value={filters.to ?? ""}
            onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
          />
        </label>
        <label>
          Status
          <select
            value={filters.status ?? ""}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </label>
        <label>
          Platform
          <select
            value={filters.platform ?? ""}
            onChange={(event) => setFilters((current) => ({ ...current, platform: event.target.value }))}
          >
            <option value="">All</option>
            {platforms.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </label>
      </section>

      {error ? <p className="error">{error}</p> : null}

      <section className="chart-section">
        <h2>Ads Over Time</h2>
        <div className="chart-frame">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={summary}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="active" stackId="1" stroke="#1f9d61" fill="#7bdca9" />
              <Area type="monotone" dataKey="inactive" stackId="1" stroke="#ba3f4a" fill="#ef9a9f" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="ads-section">
        <h2>Scraped Ads</h2>
        {isLoading ? <p className="muted">Loading ads...</p> : <AdsTable ads={ads} />}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AdsTable({ ads }: { ads: Ad[] }) {
  if (ads.length === 0) {
    return <p className="muted">No ads yet. Run the scraper to populate the dashboard.</p>;
  }

  return (
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
              <td>{renderAsset(ad)}</td>
              <td>{ad.id}</td>
              <td>
                <span className={`badge ${ad.status.toLowerCase()}`}>{ad.status}</span>
              </td>
              <td>{ad.platforms.join(", ") || "-"}</td>
              <td>{formatDate(ad.startDate)}</td>
              <td>{formatDate(ad.endDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderAsset(ad: Ad) {
  if (!ad.assetUrl) {
    return <span className="asset-placeholder">No asset</span>;
  }

  if (ad.assetType === "video") {
    return <video className="asset" src={ad.assetUrl} muted controls preload="metadata" />;
  }

  return <img className="asset" src={ad.assetUrl} alt={`Ad ${ad.id}`} loading="lazy" />;
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : "-";
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}
