"use client";

import { cn } from "@/lib/cn";
import {
  DASHBOARD_DATE_PRESETS,
  DASHBOARD_PRESET_LABELS,
  type DashboardDatePreset,
} from "@/types/dashboard";

interface DateRangeFilterProps {
  preset: DashboardDatePreset;
  dateFrom: string;
  dateTo: string;
  onPresetChange: (preset: DashboardDatePreset) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
}

const compactControl = cn(
  "box-border h-9 w-max shrink-0 rounded-[8px] border border-border bg-surface px-3 text-sm leading-none text-foreground",
  "outline-none transition-colors hover:border-foreground/20 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/20",
);

export function DateRangeFilter({
  preset,
  dateFrom,
  dateTo,
  onPresetChange,
  onDateFromChange,
  onDateToChange,
}: DateRangeFilterProps) {
  return (
    <div className="inline-flex shrink-0 items-center gap-2">
      <label htmlFor="dashboard-preset" className="whitespace-nowrap text-sm font-medium leading-none text-foreground">
        Date range
      </label>
      <select
        id="dashboard-preset"
        className={compactControl}
        value={preset}
        onChange={(event) => onPresetChange(event.target.value as DashboardDatePreset)}
      >
        {DASHBOARD_DATE_PRESETS.map((item) => (
          <option key={item} value={item}>
            {DASHBOARD_PRESET_LABELS[item]}
          </option>
        ))}
      </select>
      {preset === "custom" ? (
        <>
          <label htmlFor="dashboard-from" className="whitespace-nowrap text-sm font-medium leading-none text-foreground">
            From
          </label>
          <input
            id="dashboard-from"
            type="date"
            className={compactControl}
            value={dateFrom}
            onChange={(event) => onDateFromChange(event.target.value)}
            required
          />
          <label htmlFor="dashboard-to" className="whitespace-nowrap text-sm font-medium leading-none text-foreground">
            To
          </label>
          <input
            id="dashboard-to"
            type="date"
            className={compactControl}
            value={dateTo}
            onChange={(event) => onDateToChange(event.target.value)}
            required
          />
        </>
      ) : null}
    </div>
  );
}
