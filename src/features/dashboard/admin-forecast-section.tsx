"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CollectedOutstandingChart } from "@/components/charts";
import { Button } from "@/components/ui/button";
import { Field, SelectInput, TextInput } from "@/components/ui/field";
import { CardSkeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/invoice-calc";
import { ApiError } from "@/lib/api/types";
import { useToast } from "@/providers/toast-provider";
import {
  FORECAST_TREND_LABELS,
  FORECAST_TREND_PRESETS,
  getDashboardForecast,
  updateCollectionTarget,
  type DashboardForecast,
  type ForecastTrendPreset,
} from "@/services/dashboard-forecast.service";

export function AdminForecastSection({ currencyHint }: { currencyHint?: string }) {
  const { notify } = useToast();
  const requestIdRef = useRef(0);
  const [trendPreset, setTrendPreset] = useState<ForecastTrendPreset>("this_month");
  const [forecast, setForecast] = useState<DashboardForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetDraft, setTargetDraft] = useState("");
  const [targetBusy, setTargetBusy] = useState(false);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const next = await getDashboardForecast(trendPreset);
      if (requestId !== requestIdRef.current) {
        return;
      }
      setForecast(next);
      setTargetDraft(next.target.amount ? String(Number(next.target.amount)) : "");
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setError(err instanceof ApiError ? err.message : "Unable to load forecast.");
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [trendPreset]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveTarget() {
    setTargetBusy(true);
    try {
      await updateCollectionTarget(targetDraft.trim() || "0");
      notify("Monthly collection target updated");
      setEditingTarget(false);
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to save target.", "error");
    } finally {
      setTargetBusy(false);
    }
  }

  const currency = forecast?.currency ?? currencyHint ?? "USD";

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Forecast & Insights</h2>
          <p className="mt-1 text-sm text-muted">
            Estimated outlook based on outstanding invoices, due dates, and payments. Not a guarantee.
          </p>
        </div>
        <div className="w-full sm:w-48">
          <Field label="Trend range" htmlFor="forecast-trend">
            <SelectInput
              id="forecast-trend"
              value={trendPreset}
              onChange={(event) => setTrendPreset(event.target.value as ForecastTrendPreset)}
            >
              {FORECAST_TREND_PRESETS.map((preset) => (
                <option key={preset} value={preset}>
                  {FORECAST_TREND_LABELS[preset]}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
      </div>

      {loading && !forecast ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <CardSkeleton className="h-24" />
          <CardSkeleton className="h-24" />
          <CardSkeleton className="h-24" />
          <CardSkeleton className="h-24" />
        </div>
      ) : error && !forecast ? (
        <p className="text-sm text-muted">{error}</p>
      ) : forecast && !forecast.hasEnoughData ? (
        <div className="rounded-xl border border-dashed border-border bg-muted-soft/40 px-5 py-10 text-center">
          <p className="text-sm font-medium text-foreground">
            Not enough data to generate a forecast yet.
          </p>
          <p className="mt-1 text-sm text-muted">
            Forecasts appear once your members create invoices or record payments.
          </p>
        </div>
      ) : forecast ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ForecastMetric
              label="Due this month"
              value={formatMoney(forecast.expectedThisMonth, currency)}
              hint="Open balances with due date in this calendar month"
            />
            <ForecastMetric
              label="Due in 30 days"
              value={formatMoney(forecast.expectedNext30Days, currency)}
              hint="Open balances due from today through the next 30 days"
            />
            <ForecastMetric
              label="Outstanding"
              value={formatMoney(forecast.outstandingAmount, currency)}
              hint="Unpaid balance on open invoices"
            />
            <ForecastMetric
              label="Overdue"
              value={formatMoney(forecast.overdueAmount, currency)}
              hint="Past due and still unpaid"
              tone={Number(forecast.overdueAmount) > 0 ? "warning" : "default"}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <div className="space-y-4">
              <TargetProgress
                currency={currency}
                forecast={forecast}
                editing={editingTarget}
                draft={targetDraft}
                busy={targetBusy}
                onEdit={() => setEditingTarget(true)}
                onCancel={() => {
                  setEditingTarget(false);
                  setTargetDraft(forecast.target.amount ? String(Number(forecast.target.amount)) : "");
                }}
                onDraftChange={setTargetDraft}
                onSave={() => void saveTarget()}
              />

              <div className="rounded-xl border border-border bg-muted-soft/30 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Insights</h3>
                {forecast.insights.length === 0 ? (
                  <p className="mt-3 text-sm text-muted">
                    No special insights right now. Keep invoices current to improve forecasts.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {forecast.insights.map((insight) => (
                      <li
                        key={insight.id}
                        className={`rounded-lg border px-3 py-2 text-sm ${insightToneClass(insight.tone)}`}
                      >
                        {insight.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <CollectedOutstandingChart
              points={forecast.trend}
              currency={currency}
              loading={loading}
              error={error}
            />
          </div>
        </>
      ) : null}
    </section>
  );
}

function ForecastMetric({
  label,
  value,
  hint,
  badge,
  tone = "default",
}: {
  label: string;
  value: string;
  hint: string;
  badge?: string;
  tone?: "default" | "warning";
}) {
  return (
    <article className="rounded-xl border border-border bg-muted-soft/20 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        {badge ? (
          <span className="rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
            {badge}
          </span>
        ) : null}
      </div>
      <p
        className={`mt-2 text-xl font-semibold tracking-tight tabular-nums ${
          tone === "warning" ? "text-warning" : "text-foreground"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </article>
  );
}

function TargetProgress({
  currency,
  forecast,
  editing,
  draft,
  busy,
  onEdit,
  onCancel,
  onDraftChange,
  onSave,
}: {
  currency: string;
  forecast: DashboardForecast;
  editing: boolean;
  draft: string;
  busy: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onDraftChange: (value: string) => void;
  onSave: () => void;
}) {
  const targetAmount = forecast.target.amount;
  const hasTarget = Boolean(targetAmount && Number(targetAmount) > 0);

  return (
    <div className="rounded-xl border border-border bg-muted-soft/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Monthly target
          </h3>
          <p className="mt-1 text-xs text-muted">Collection goal for the current calendar month.</p>
        </div>
        {!editing ? (
          <Button variant="ghost" onClick={onEdit}>
            {hasTarget ? "Edit" : "Set target"}
          </Button>
        ) : null}
      </div>

      {editing ? (
        <div className="mt-4 space-y-3">
          <Field label="Target amount" htmlFor="collection-target">
            <TextInput
              id="collection-target"
              type="number"
              min="0"
              step="0.01"
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
              placeholder="e.g. 500000"
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onSave} disabled={busy || !draft.trim()}>
              {busy ? "Saving…" : "Save target"}
            </Button>
            <Button variant="secondary" onClick={onCancel} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      ) : !hasTarget ? (
        <p className="mt-4 text-sm text-muted">
          Set a monthly collection target to track progress against payments received.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-sm text-muted">
                Target:{" "}
                <span className="font-medium text-foreground">
                  {formatMoney(targetAmount!, currency)}
                </span>
              </p>
              <p className="mt-1 text-sm text-muted">
                Collected:{" "}
                <span className="font-medium text-foreground">
                  {formatMoney(forecast.target.collected, currency)}
                </span>
              </p>
            </div>
            <p className="text-lg font-semibold tabular-nums text-foreground">
              {forecast.target.percentComplete}%
            </p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${forecast.target.percentComplete}%` }}
            />
          </div>
          <p className="text-xs text-muted">
            Remaining: {formatMoney(forecast.target.remaining, currency)}
          </p>
        </div>
      )}
    </div>
  );
}

function insightToneClass(tone: "neutral" | "positive" | "warning"): string {
  if (tone === "positive") {
    return "border-success/20 bg-success-soft/40 text-foreground";
  }
  if (tone === "warning") {
    return "border-warning/20 bg-warning-soft/40 text-foreground";
  }
  return "border-border bg-surface text-foreground";
}
