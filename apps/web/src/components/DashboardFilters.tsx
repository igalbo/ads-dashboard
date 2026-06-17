import { CalendarDays } from "lucide-react";
import { AdFilters } from "../api/client";
import { PlatformMultiSelect } from "./PlatformMultiSelect";

type Props = {
  filters: AdFilters;
  platformOptions: string[];
  onChange: (filters: AdFilters) => void;
};

export function DashboardFilters({ filters, platformOptions, onChange }: Props) {
  return (
    <section className="filters">
      <label>
        <span className="filter-label-title">
          <CalendarDays size={16} />
          From
        </span>
        <input
          onChange={(event) => onChange({ ...filters, from: event.target.value })}
          type="date"
          value={filters.from ?? ""}
        />
      </label>
      <label>
        <span className="filter-label-title">
          <CalendarDays size={16} />
          To
        </span>
        <input
          onChange={(event) => onChange({ ...filters, to: event.target.value })}
          type="date"
          value={filters.to ?? ""}
        />
      </label>
      <label>
        Status
        <select onChange={(event) => onChange({ ...filters, status: event.target.value })} value={filters.status ?? ""}>
          <option value="">All</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </label>
      <div className="filter-field">
        <span className="filter-label-title">Platform</span>
        <PlatformMultiSelect
          onChange={(platforms) => onChange({ ...filters, platform: platforms })}
          options={platformOptions}
          selectedPlatforms={filters.platform ?? []}
        />
      </div>
    </section>
  );
}
