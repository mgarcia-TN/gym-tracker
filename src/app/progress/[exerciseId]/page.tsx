"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useExercise, useWorkoutsByExercise, getMaxWeightForExercise } from "@/db/hooks";
import { useAuth } from "@/components/AuthProvider";
import ProgressChart from "@/components/ProgressChart";

type ViewMode = "average" | "bySeries" | "volume";

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "average", label: "Promedio" },
  { value: "bySeries", label: "Por serie" },
  { value: "volume", label: "Volumen" },
];

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function ExerciseProgressPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const exerciseId = Number(params.exerciseId);
  const exercise = useExercise(exerciseId);
  const workouts = useWorkoutsByExercise(exerciseId);
  const [viewMode, setViewMode] = useState<ViewMode>("average");
  const [pr, setPr] = useState<number>(0);

  useEffect(() => {
    if (!user) return;
    getMaxWeightForExercise(exerciseId, user.id).then(setPr);
  }, [user, exerciseId, workouts]);

  const totalVolume = useMemo(() => {
    let vol = 0;
    for (const w of workouts) {
      for (const s of w.series) vol += s.weight * s.reps;
    }
    return vol;
  }, [workouts]);

  if (!exercise) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-4">
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:text-foreground"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z" clipRule="evenodd" />
          </svg>
        </button>
        <h1 className="flex-1 text-xl font-bold">{exercise.name}</h1>
      </div>

      <div className="mb-4 flex gap-3">
        <div className="flex flex-1 flex-col items-center rounded-xl bg-card p-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">PR</span>
          <span className="text-lg font-bold text-amber-400">{pr > 0 ? `${pr}kg` : "-"}</span>
        </div>
        <div className="flex flex-1 flex-col items-center rounded-xl bg-card p-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Sesiones</span>
          <span className="text-lg font-bold">{workouts.length}</span>
        </div>
        <div className="flex flex-1 flex-col items-center rounded-xl bg-card p-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Vol. total</span>
          <span className="text-lg font-bold">{totalVolume > 0 ? `${Math.round(totalVolume / 1000)}t` : "-"}</span>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {VIEW_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setViewMode(opt.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === opt.value
                ? "bg-accent text-background"
                : "bg-card text-muted"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="mb-6 rounded-xl bg-card p-3">
        <ProgressChart workouts={workouts} viewMode={viewMode} />
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
        Historial
      </h2>

      {workouts.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          No hay registros para este ejercicio
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {[...workouts].reverse().map((w) => (
            <div key={w.id} className="rounded-xl bg-card p-3">
              <p className="mb-2 text-xs font-medium text-muted">
                {formatDate(w.date)}
              </p>
              <div className="flex gap-2">
                {w.series.map((s) => (
                  <div
                    key={s.seriesNumber}
                    className="relative flex flex-1 flex-col items-center rounded-lg bg-background py-1.5"
                  >
                    {s.weight >= pr && pr > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[8px] font-bold text-background">
                        PR
                      </span>
                    )}
                    <span className="text-[10px] text-muted">
                      S{s.seriesNumber}
                    </span>
                    <span className="text-xs font-bold tabular-nums">
                      {s.weight}kg
                    </span>
                    <span className="text-[10px] tabular-nums text-muted">
                      {s.reps}r
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
