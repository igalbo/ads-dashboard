const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export type Ad = {
  id: string;
  status: "ACTIVE" | "INACTIVE";
  platforms: string[];
  startDate: string | null;
  endDate: string | null;
  assetUrl: string | null;
  assetType: string | null;
};

export type ScrapeRun = {
  id: string;
  status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";
  startedAt: string;
  finishedAt: string | null;
  error: string | null;
  adsFound: number;
};

export type SummaryPoint = {
  date: string;
  active: number;
  inactive: number;
};

export type AdFilters = {
  from?: string;
  to?: string;
  status?: string;
  platform?: string;
};

export async function getAds(filters: AdFilters) {
  return request<Ad[]>(`/ads${toQueryString(filters)}`);
}

export async function getAdsSummary(filters: AdFilters) {
  return request<SummaryPoint[]>(`/ads/summary${toQueryString(filters)}`);
}

export async function startScrape() {
  return request<ScrapeRun>("/scrapes", { method: "POST" });
}

export async function getLatestScrape() {
  return request<ScrapeRun | null>("/scrapes/latest");
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function toQueryString(filters: AdFilters) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}
