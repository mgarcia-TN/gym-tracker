"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { WorkoutEntry } from "@/types";

interface ProgressChartProps {
  workouts: WorkoutEntry[];
  viewMode: "average" | "bySeries" | "volume";
}

interface ChartDataPoint {
  date: string;
  displayDate: string;
  avgWeight: number;
  volume: number;
  [key: string]: string | number;
}

const SERIES_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"];

function formatDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export default function ProgressChart({
  workouts,
  viewMode,
}: ProgressChartProps) {
  if (workouts.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        No hay datos para graficar
      </p>
    );
  }

  let maxSeries = 0;

  const data: ChartDataPoint[] = workouts.map((w) => {
    const point: ChartDataPoint = {
      date: w.date,
      displayDate: formatDate(w.date),
      avgWeight: 0,
      volume: 0,
    };

    let totalWeight = 0;
    let totalVolume = 0;
    for (const s of w.series) {
      point[`s${s.seriesNumber}`] = s.weight;
      totalWeight += s.weight;
      totalVolume += s.weight * s.reps;
      if (s.seriesNumber > maxSeries) maxSeries = s.seriesNumber;
    }
    point.avgWeight =
      w.series.length > 0
        ? Math.round((totalWeight / w.series.length) * 10) / 10
        : 0;
    point.volume = Math.round(totalVolume);

    return point;
  });

  const isVolume = viewMode === "volume";
  const yUnit = isVolume ? "" : "kg";

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis
            dataKey="displayDate"
            tick={{ fill: "#888", fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#888", fontSize: 11 }}
            tickLine={false}
            unit={yUnit}
          />
          <Tooltip
            contentStyle={{
              background: "#161616",
              border: "1px solid #2a2a2a",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          {viewMode === "average" ? (
            <Line
              type="monotone"
              dataKey="avgWeight"
              name="Promedio"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 4, fill: "#22c55e" }}
              activeDot={{ r: 6 }}
            />
          ) : viewMode === "volume" ? (
            <Line
              type="monotone"
              dataKey="volume"
              name="Volumen (kg x reps)"
              stroke="#a78bfa"
              strokeWidth={2}
              dot={{ r: 4, fill: "#a78bfa" }}
              activeDot={{ r: 6 }}
            />
          ) : (
            <>
              <Legend />
              {Array.from({ length: maxSeries }, (_, i) => (
                <Line
                  key={i}
                  type="monotone"
                  dataKey={`s${i + 1}`}
                  name={`Serie ${i + 1}`}
                  stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                  strokeWidth={2}
                  dot={{
                    r: 3,
                    fill: SERIES_COLORS[i % SERIES_COLORS.length],
                  }}
                  connectNulls
                />
              ))}
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
