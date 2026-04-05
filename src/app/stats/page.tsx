"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useWorkoutEntries, useExercises } from "@/db/hooks";

function getStreakDays(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort((a, b) => b.localeCompare(a));
  let streak = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = new Date(sorted[i]);
    const prev = new Date(sorted[i + 1]);
    const diffMs = curr.getTime() - prev.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function getDaysInLastMonth(dates: string[]): number {
  const now = new Date();
  const monthAgo = new Date(now);
  monthAgo.setDate(now.getDate() - 30);
  const cutoff = monthAgo.toISOString().split("T")[0];
  const unique = new Set(dates.filter((d) => d >= cutoff));
  return unique.size;
}

function getBestWeeklyVolume(
  entries: { date: string; series: { weight: number; reps: number }[] }[],
): number {
  const weekVolumes = new Map<string, number>();

  for (const entry of entries) {
    const d = new Date(entry.date);
    const day = d.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMon);
    const weekKey = monday.toISOString().split("T")[0];

    let vol = 0;
    for (const s of entry.series) vol += s.weight * s.reps;
    weekVolumes.set(weekKey, (weekVolumes.get(weekKey) ?? 0) + vol);
  }

  let best = 0;
  for (const vol of weekVolumes.values()) {
    if (vol > best) best = vol;
  }
  return Math.round(best);
}

export default function StatsPage() {
  const entries = useWorkoutEntries();
  const exercises = useExercises();

  const stats = useMemo(() => {
    const dates = entries.map((e) => e.date);
    const uniqueDays = new Set(dates).size;

    const freqMap = new Map<number, number>();
    for (const e of entries) {
      freqMap.set(e.exercise_id, (freqMap.get(e.exercise_id) ?? 0) + 1);
    }
    let topExId = 0;
    let topCount = 0;
    for (const [exId, count] of freqMap) {
      if (count > topCount) {
        topExId = exId;
        topCount = count;
      }
    }
    const topExercise = exercises.find((e) => e.id === topExId);

    return {
      totalDays: uniqueDays,
      totalEntries: entries.length,
      streak: getStreakDays(dates),
      last30: getDaysInLastMonth(dates),
      bestWeekVolume: getBestWeeklyVolume(entries),
      topExercise: topExercise?.name ?? "-",
      topExerciseCount: topCount,
    };
  }, [entries, exercises]);

  return (
    <div className="flex flex-1 flex-col p-4">
      <h1 className="mb-4 text-xl font-bold">Estadísticas</h1>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <StatCard label="Días entrenados" value={String(stats.totalDays)} />
        <StatCard label="Racha actual" value={`${stats.streak} ${stats.streak === 1 ? "día" : "días"}`} />
        <StatCard label="Últimos 30 días" value={`${stats.last30} días`} />
        <StatCard label="Ejercicios registrados" value={String(stats.totalEntries)} />
        <StatCard
          label="Mejor volumen semanal"
          value={stats.bestWeekVolume > 0 ? `${Math.round(stats.bestWeekVolume / 1000)}t` : "-"}
        />
        <StatCard
          label="Ejercicio favorito"
          value={stats.topExercise}
          sub={stats.topExerciseCount > 0 ? `${stats.topExerciseCount} veces` : undefined}
        />
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
        Progreso por ejercicio
      </h2>

      {exercises.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          Cargá ejercicios para ver tu progreso
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {exercises.map((ex) => (
            <Link
              key={ex.id}
              href={`/progress/${ex.id}`}
              className="flex items-center justify-between rounded-xl bg-card p-4 transition-colors hover:bg-card-hover"
            >
              <div>
                <span className="text-sm font-medium">{ex.name}</span>
                <p className="text-xs text-muted">{ex.muscle_group}</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-muted">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-card p-3 text-center">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</span>
      <span className="mt-1 text-lg font-bold">{value}</span>
      {sub && <span className="text-[10px] text-muted">{sub}</span>}
    </div>
  );
}
