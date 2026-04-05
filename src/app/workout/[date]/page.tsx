"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useWorkoutEntries,
  useExercises,
  deleteWorkoutEntry,
  deleteWorkoutEntriesByDate,
} from "@/db/hooks";
import { useAuth } from "@/components/AuthProvider";
import type { MuscleGroup } from "@/types";

const GROUP_COLORS: Record<MuscleGroup, string> = {
  Pecho: "bg-red-500/15 text-red-400",
  Espalda: "bg-blue-500/15 text-blue-400",
  Bíceps: "bg-amber-500/15 text-amber-400",
  Tríceps: "bg-purple-500/15 text-purple-400",
  Hombro: "bg-cyan-500/15 text-cyan-400",
  Piernas: "bg-green-500/15 text-green-400",
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
  const dayName = dateObj.toLocaleDateString("es-AR", { weekday: "long" });
  const capitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  return `${capitalized} ${d}/${m}/${y}`;
}

export default function WorkoutDatePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const date = params.date as string;

  const allEntries = useWorkoutEntries();
  const exercises = useExercises();

  const exerciseMap = useMemo(
    () => new Map(exercises.map((e) => [e.id, e])),
    [exercises],
  );

  const entries = useMemo(
    () => allEntries.filter((e) => e.date === date),
    [allEntries, date],
  );

  async function handleDeleteDay() {
    if (!user) return;
    await deleteWorkoutEntriesByDate(date, user.id);
    router.push("/");
  }

  async function handleDeleteEntry(id: number) {
    await deleteWorkoutEntry(id);
    const remaining = entries.filter((e) => e.id !== id);
    if (remaining.length === 0) {
      router.push("/");
    }
  }

  return (
    <div className="flex flex-1 flex-col p-4">
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:text-foreground"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">{formatDate(date)}</h1>
        </div>
        <button
          onClick={handleDeleteDay}
          className="rounded-lg px-2 py-1 text-xs text-danger/60 transition-colors hover:text-danger"
        >
          Borrar día
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          No hay ejercicios registrados este día
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => {
            const exercise = exerciseMap.get(entry.exercise_id);
            const exerciseName = exercise?.name ?? "Ejercicio eliminado";
            const group = exercise?.muscle_group;

            return (
              <div key={entry.id} className="rounded-xl bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold">{exerciseName}</p>
                    {group && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${GROUP_COLORS[group]}`}
                      >
                        {group}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="rounded-lg px-2 py-1 text-xs text-danger/60 transition-colors hover:text-danger"
                  >
                    Borrar
                  </button>
                </div>

                <div className="flex gap-2">
                  {entry.series.map((s) => (
                    <div
                      key={s.seriesNumber}
                      className="flex flex-1 flex-col items-center rounded-lg bg-background px-2 py-2"
                    >
                      <span className="text-[10px] font-medium uppercase tracking-wider text-muted">
                        S{s.seriesNumber}
                      </span>
                      <span className="text-sm font-bold tabular-nums">
                        {s.weight}
                        <span className="text-xs font-normal text-muted">
                          kg
                        </span>
                      </span>
                      <span className="text-xs tabular-nums text-muted">
                        {s.reps} reps
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
