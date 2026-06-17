import { Ad } from "../api/client";

export function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : "-";
}

export function formatEndDate(ad: Ad) {
  return ad.status === "ACTIVE" ? "Still running" : formatDate(ad.endDate);
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}
