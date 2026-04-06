"use client";

import type { SeriesData } from "@/types";

interface SeriesInputProps {
  series: SeriesData;
  onChange: (updated: SeriesData) => void;
}

export default function SeriesInput({ series, onChange }: SeriesInputProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-background p-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
        {series.seriesNumber}
      </span>

      <div className="flex flex-1 items-center gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wider text-muted">
            Peso (kg)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={series.weight ? String(series.weight).replace(".", ",") : ""}
            onChange={(e) => {
              const raw = e.target.value.replace(",", ".");
              if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
                onChange({ ...series, weight: raw === "" ? 0 : parseFloat(raw) || 0 });
              }
            }}
            placeholder="0"
            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-center text-base font-medium tabular-nums focus:border-accent focus:outline-none"
          />
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wider text-muted">
            Reps
          </label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={series.reps || ""}
            onChange={(e) =>
              onChange({
                ...series,
                reps: parseInt(e.target.value, 10) || 0,
              })
            }
            placeholder="0"
            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-center text-base font-medium tabular-nums focus:border-accent focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
