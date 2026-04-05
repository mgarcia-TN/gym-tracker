"use client";

import { useMemo, useEffect } from "react";
import Link from "next/link";
import { useWorkoutEntries, useExercises } from "@/db/hooks";
import { useAuth } from "@/components/AuthProvider";
import { seedExercisesIfEmpty } from "@/db/seed";
import WorkoutDayCard from "@/components/WorkoutCard";
import type { WorkoutEntry } from "@/types";

function groupByDate(entries: WorkoutEntry[]): Map<string, WorkoutEntry[]> {
  const map = new Map<string, WorkoutEntry[]>();
  for (const e of entries) {
    const group = map.get(e.date);
    if (group) {
      group.push(e);
    } else {
      map.set(e.date, [e]);
    }
  }
  return map;
}

function getWeekDates(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMon);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  return { start: fmt(monday), end: fmt(sunday) };
}

export default function HomePage() {
  const { user, signOut } = useAuth();
  const entries = useWorkoutEntries();
  const exercises = useExercises();

  useEffect(() => {
    if (user) {
      seedExercisesIfEmpty(user.id);
    }
  }, [user]);

  const exerciseMap = useMemo(
    () => new Map(exercises.map((e) => [e.id, e])),
    [exercises],
  );

  const dayGroups = useMemo(() => groupByDate(entries), [entries]);
  const sortedDates = useMemo(
    () => [...dayGroups.keys()].sort((a, b) => b.localeCompare(a)),
    [dayGroups],
  );

  const weekDays = useMemo(() => {
    const { start, end } = getWeekDates();
    const uniqueDates = new Set(
      entries
        .map((e) => e.date)
        .filter((d) => d >= start && d <= end),
    );
    return uniqueDates.size;
  }, [entries]);

  return (
    <div className="flex flex-1 flex-col p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Mis entrenos</h1>
        <button
          onClick={signOut}
          className="text-xs text-muted transition-colors hover:text-foreground"
        >
          Salir
        </button>
      </div>

      {entries.length > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-card p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15">
            <span className="text-lg font-bold text-accent">{weekDays}</span>
          </div>
          <div>
            <p className="text-sm font-semibold">
              {weekDays === 1 ? "1 día" : `${weekDays} días`} esta semana
            </p>
            <p className="text-xs text-muted">Lunes a domingo</p>
          </div>
        </div>
      )}

      {sortedDates.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <div className="text-4xl">🏋️</div>
          <p className="text-sm text-muted">
            Todavía no registraste ningún entreno
          </p>
          <Link
            href="/workout/new"
            className="rounded-xl bg-accent px-6 py-3 text-sm font-bold text-background transition-colors hover:bg-accent-hover"
          >
            Registrar entreno
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sortedDates.map((date) => (
            <WorkoutDayCard
              key={date}
              date={date}
              entries={dayGroups.get(date)!}
              exerciseMap={exerciseMap}
            />
          ))}
        </div>
      )}

      {sortedDates.length > 0 && (
        <Link
          href="/workout/new"
          className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl font-bold text-background shadow-lg transition-colors hover:bg-accent-hover"
        >
          +
        </Link>
      )}
    </div>
  );
}
