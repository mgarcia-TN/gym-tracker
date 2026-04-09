"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useWorkoutEntries,
  useExercises,
  deleteWorkoutEntry,
  deleteWorkoutEntriesByDate,
  updateWorkoutEntry,
  saveEntryOrder,
  getMaxWeightForExercise,
  getPreviousWorkoutForExercise,
} from "@/db/hooks";
import { useAuth } from "@/components/AuthProvider";
import SeriesInput from "@/components/SeriesInput";
import type { MuscleGroup, SeriesData, WorkoutEntry } from "@/types";

const SERIES_COUNT = 4;

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

function padSeries(series: SeriesData[]): SeriesData[] {
  const padded = [...series];
  while (padded.length < SERIES_COUNT) {
    padded.push({ seriesNumber: padded.length + 1, weight: 0, reps: 0 });
  }
  return padded;
}

function diffLabel(current: number, previous: number): { text: string; color: string } | null {
  const diff = current - previous;
  if (diff === 0) return null;
  const sign = diff > 0 ? "+" : "";
  return {
    text: `${sign}${diff}`,
    color: diff > 0 ? "text-green-400" : "text-red-400",
  };
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

  const rawEntries = useMemo(
    () => allEntries.filter((e) => e.date === date).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id),
    [allEntries, date],
  );

  const [orderedEntries, setOrderedEntries] = useState<WorkoutEntry[]>([]);
  const [swappingId, setSwappingId] = useState<number | null>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const isReordering = useRef(false);

  useEffect(() => {
    if (!isReordering.current) {
      setOrderedEntries(rawEntries);
    }
  }, [rawEntries]);

  const entries = orderedEntries;

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editSeries, setEditSeries] = useState<SeriesData[]>([]);
  const [saving, setSaving] = useState(false);
  const [prMap, setPrMap] = useState<Map<number, number>>(new Map());
  const [prevMap, setPrevMap] = useState<Map<number, WorkoutEntry>>(new Map());

  useEffect(() => {
    if (!user || entries.length === 0) return;
    const exerciseIds = [...new Set(entries.map((e) => e.exercise_id))];

    Promise.all(
      exerciseIds.map(async (exId) => {
        const maxW = await getMaxWeightForExercise(exId, user.id);
        return [exId, maxW] as [number, number];
      }),
    ).then((results) => {
      setPrMap(new Map(results));
    });

    Promise.all(
      exerciseIds.map(async (exId) => {
        const prev = await getPreviousWorkoutForExercise(exId, user.id, date);
        return prev ? ([exId, prev] as [number, WorkoutEntry]) : null;
      }),
    ).then((results) => {
      const map = new Map<number, WorkoutEntry>();
      for (const r of results) {
        if (r) map.set(r[0], r[1]);
      }
      setPrevMap(map);
    });
  }, [user, entries, date]);

  function isSeriesPR(exerciseId: number, weight: number): boolean {
    const maxWeight = prMap.get(exerciseId);
    return maxWeight != null && weight > 0 && weight >= maxWeight;
  }

  function getPrevSeries(exerciseId: number, seriesNumber: number): SeriesData | undefined {
    const prev = prevMap.get(exerciseId);
    return prev?.series.find((s) => s.seriesNumber === seriesNumber);
  }

  function startEdit(entryId: number, currentSeries: SeriesData[]) {
    setEditingId(entryId);
    setEditSeries(padSeries(currentSeries));
  }

  function handleSeriesChange(idx: number, updated: SeriesData) {
    setEditSeries((prev) => prev.map((s, i) => (i === idx ? updated : s)));
  }

  async function handleSaveEdit() {
    if (editingId == null) return;
    setSaving(true);
    const filtered = editSeries.filter((s) => s.weight > 0 || s.reps > 0);
    await updateWorkoutEntry(editingId, { series: filtered });
    setEditingId(null);
    setSaving(false);
  }

  async function moveEntry(entryId: number, direction: -1 | 1) {
    const idx = orderedEntries.findIndex((e) => e.id === entryId);
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= orderedEntries.length) return;
    if (swappingId !== null) return;

    setSwappingId(entryId);
    isReordering.current = true;

    const a = orderedEntries[idx];
    const b = orderedEntries[targetIdx];
    const elA = itemRefs.current.get(a.id);
    const elB = itemRefs.current.get(b.id);

    const next = [...orderedEntries];
    [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
    const orderPayload = next.map((e, i) => ({ id: e.id, sort_order: i }));

    if (elA && elB) {
      const rectA = elA.getBoundingClientRect();
      const rectB = elB.getBoundingClientRect();
      const deltaA = rectB.top - rectA.top;
      const deltaB = rectA.top - rectB.top;

      elA.style.transition = "none";
      elA.style.transform = "translateY(0px)";
      elB.style.transition = "none";
      elB.style.transform = "translateY(0px)";

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          elA.style.transition = "transform 250ms ease";
          elA.style.transform = `translateY(${deltaA}px)`;
          elB.style.transition = "transform 250ms ease";
          elB.style.transform = `translateY(${deltaB}px)`;

          setTimeout(() => {
            elA.style.transition = "none";
            elA.style.transform = "";
            elB.style.transition = "none";
            elB.style.transform = "";
            setOrderedEntries(next);
          }, 260);
        });
      });
    } else {
      setOrderedEntries(next);
    }

    await saveEntryOrder(orderPayload);
    setSwappingId(null);
    setTimeout(() => { isReordering.current = false; }, 500);
  }

  async function handleDeleteDay() {
    if (!user) return;
    if (!confirm("¿Borrar todo el día? Esta acción no se puede deshacer.")) return;
    await deleteWorkoutEntriesByDate(date, user.id);
    router.push("/");
  }

  async function handleDeleteEntry(id: number) {
    if (!confirm("¿Borrar este ejercicio?")) return;
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
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z" clipRule="evenodd" />
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
          {entries.map((entry, entryIdx) => {
            const exercise = exerciseMap.get(entry.exercise_id);
            const exerciseName = exercise?.name ?? "Ejercicio eliminado";
            const group = exercise?.muscle_group;
            const isEditing = editingId === entry.id;

            return (
              <div
                key={entry.id}
                ref={(el) => { if (el) itemRefs.current.set(entry.id, el); else itemRefs.current.delete(entry.id); }}
                className="rounded-xl bg-card p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold">{exerciseName}</p>
                    {group && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${GROUP_COLORS[group]}`}>
                        {group}
                      </span>
                    )}
                  </div>
                  {!isEditing && (
                    <div className="flex items-center gap-1">
                      {entries.length > 1 && entryIdx > 0 && (
                        <button
                          onClick={() => moveEntry(entry.id, -1)}
                          disabled={swappingId !== null}
                          className="flex h-6 w-6 items-center justify-center rounded text-muted transition-colors hover:text-foreground disabled:opacity-40"
                          title="Subir"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                            <path fillRule="evenodd" d="M9.47 6.47a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 1 1-1.06 1.06L10 8.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06l4.25-4.25Z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                      {entries.length > 1 && entryIdx < entries.length - 1 && (
                        <button
                          onClick={() => moveEntry(entry.id, 1)}
                          disabled={swappingId !== null}
                          className="flex h-6 w-6 items-center justify-center rounded text-muted transition-colors hover:text-foreground disabled:opacity-40"
                          title="Bajar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0l-4.25-4.25a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => startEdit(entry.id, entry.series)}
                        className="rounded-lg px-2 py-1 text-xs text-muted transition-colors hover:text-foreground"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="rounded-lg px-2 py-1 text-xs text-danger/60 transition-colors hover:text-danger"
                      >
                        Borrar
                      </button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted">
                      Editando series
                    </span>
                    {editSeries.map((s, i) => (
                      <SeriesInput
                        key={s.seriesNumber}
                        series={s}
                        syncKey={editingId}
                        onChange={(updated) => handleSeriesChange(i, updated)}
                      />
                    ))}
                    <div className="mt-1 flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        disabled={saving}
                        className="flex-1 rounded-lg bg-accent py-2 text-xs font-semibold text-background"
                      >
                        {saving ? "Guardando..." : "Guardar"}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border border-border px-4 py-2 text-xs text-muted"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {entry.series.map((s) => {
                      const prev = getPrevSeries(entry.exercise_id, s.seriesNumber);
                      const weightDiff = prev ? diffLabel(s.weight, prev.weight) : null;
                      const repsDiff = prev ? diffLabel(s.reps, prev.reps) : null;

                      return (
                        <div
                          key={s.seriesNumber}
                          className="relative flex flex-1 flex-col items-center rounded-lg bg-background px-2 py-2"
                        >
                          {isSeriesPR(entry.exercise_id, s.weight) && (
                            <span className="absolute -top-1.5 -right-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[8px] font-bold text-background">
                              PR
                            </span>
                          )}
                          <span className="text-[10px] font-medium uppercase tracking-wider text-muted">
                            S{s.seriesNumber}
                          </span>
                          <span className="text-sm font-bold tabular-nums">
                            {s.weight}
                            <span className="text-xs font-normal text-muted">kg</span>
                          </span>
                          {weightDiff && (
                            <span className={`text-[9px] font-semibold tabular-nums ${weightDiff.color}`}>
                              {weightDiff.text}kg
                            </span>
                          )}
                          <span className="text-xs tabular-nums text-muted">
                            {s.reps} reps
                          </span>
                          {repsDiff && (
                            <span className={`text-[9px] font-semibold tabular-nums ${repsDiff.color}`}>
                              {repsDiff.text}r
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
