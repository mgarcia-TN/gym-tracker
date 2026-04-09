"use client";

import { useEffect, useState } from "react";
import type { SeriesData } from "@/types";

interface SeriesInputProps {
  series: SeriesData;
  onChange: (updated: SeriesData) => void;
  /** When this value changes (ej. ejercicio o entrada en edición), el texto del peso se resetea desde `series`. */
  syncKey?: string | number | null;
}

function formatWeightDisplay(weight: number): string {
  if (weight === 0) return "";
  return String(weight).replace(".", ",");
}

function parseWeightToNumber(display: string): number {
  const raw = display.replace(",", ".").trim();
  if (raw === "" || raw === ".") return 0;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

function isValidPartialWeightInput(value: string): boolean {
  const normalized = value.replace(",", ".");
  return value === "" || /^\d*\.?\d*$/.test(normalized);
}

export default function SeriesInput({
  series,
  onChange,
  syncKey,
}: SeriesInputProps) {
  const [weightText, setWeightText] = useState(() =>
    formatWeightDisplay(series.weight),
  );

  useEffect(() => {
    setWeightText(formatWeightDisplay(series.weight));
  }, [syncKey]);

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
            value={weightText}
            onChange={(e) => {
              const v = e.target.value;
              if (!isValidPartialWeightInput(v)) return;
              setWeightText(v);
              onChange({
                ...series,
                weight: parseWeightToNumber(v),
              });
            }}
            onBlur={() => {
              const parsed = parseWeightToNumber(weightText);
              setWeightText(formatWeightDisplay(parsed));
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
