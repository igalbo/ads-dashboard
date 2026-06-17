import type { AdFilters } from "./ads.repository.js";
import { listAds } from "./ads.repository.js";

export async function getAdsSummary(filters: AdFilters) {
  const ads = await listAds(filters);
  const range = getSummaryDateRange(ads, filters);

  if (!range) {
    return [];
  }

  return eachDate(range.from, range.to).map((date) => ({
    date: toDateKey(date),
    active: ads.filter((ad) => isActiveOnDate(ad, date)).length,
    inactive: ads.filter((ad) => isInactiveOnDate(ad, date)).length,
  }));
}

type SummaryAd = Awaited<ReturnType<typeof listAds>>[number];

function getSummaryDateRange(ads: SummaryAd[], filters: AdFilters) {
  const datedAds = ads.filter((ad) => ad.startDate);

  if (datedAds.length === 0) {
    return null;
  }

  const minStartDate = minDate(datedAds.map((ad) => ad.startDate!));
  const maxKnownDate = maxDate(
    datedAds.map((ad) => {
      if (ad.status === "ACTIVE") {
        return new Date();
      }

      return ad.endDate ?? ad.startDate!;
    }),
  );

  return {
    from: startOfDay(filters.from ?? minStartDate),
    to: startOfDay(filters.to ?? maxKnownDate),
  };
}

function isActiveOnDate(ad: SummaryAd, date: Date) {
  if (ad.status !== "ACTIVE" || !ad.startDate) {
    return false;
  }

  return startOfDay(ad.startDate) <= date;
}

function isInactiveOnDate(ad: SummaryAd, date: Date) {
  if (ad.status !== "INACTIVE" || !ad.startDate) {
    return false;
  }

  const startDate = startOfDay(ad.startDate);
  const endDate = startOfDay(ad.endDate ?? ad.startDate);

  return startDate <= date && date <= endDate;
}

function eachDate(from: Date, to: Date) {
  const dates: Date[] = [];
  const current = startOfDay(from);
  const last = startOfDay(to);

  while (current <= last) {
    dates.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

function minDate(dates: Date[]) {
  return new Date(Math.min(...dates.map((date) => date.getTime())));
}

function maxDate(dates: Date[]) {
  return new Date(Math.max(...dates.map((date) => date.getTime())));
}

function startOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setUTCHours(0, 0, 0, 0);
  return nextDate;
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
