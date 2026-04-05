"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  useExercises,
  useWorkoutEntries,
  addWorkoutEntry,
  updateWorkoutEntry,
  getLastWorkoutForExercise,
  getLatestWorkoutDay,
  ensureExerciseExists,
} from "@/db/hooks";
import { useAuth } from "@/components/AuthProvider";
import ExerciseSelect from "@/components/ExerciseSelect";
import SeriesInput from "@/components/SeriesInput";
import RestTimer from "@/components/RestTimer";
import { TEMPLATES } from "@/data/templates";
import type { SeriesData, WorkoutEntry } from "@/types";

const SERIES_COUNT = 4;

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function buildEmptySeries(): SeriesData[] {
  return Array.from({ length: SERIES_COUNT }, (_, i) => ({
    seriesNumber: i + 1,
    weight: 0,
    reps: 0,
  }));
}

function padSeries(series: SeriesData[]): SeriesData[] {
  const padded = [...series];
  while (padded.length < SERIES_COUNT) {
    padded.push({ seriesNumber: padded.length + 1, weight: 0, reps: 0 });
  }
  return padded;
}

interface ExerciseBlock {
  key: number;
  exerciseId: number | null;
  series: SeriesData[];
  lastWorkout: WorkoutEntry | null;
  savedId: number | null;
}

let blockKeyCounter = 0;
function createBlock(): ExerciseBlock {
  return {
    key: ++blockKeyCounter,
    exerciseId: null,
    series: buildEmptySeries(),
    lastWorkout: null,
    savedId: null,
  };
}

function createBlockWithExercise(exerciseId: number): ExerciseBlock {
  return {
    key: ++blockKeyCounter,
    exerciseId,
    series: buildEmptySeries(),
    lastWorkout: null,
    savedId: null,
  };
}

function createBlockFromEntry(entry: WorkoutEntry): ExerciseBlock {
  return {
    key: ++blockKeyCounter,
    exerciseId: entry.exercise_id,
    series: padSeries(entry.series),
    lastWorkout: entry,
    savedId: null,
  };
}

export default function NewWorkoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const exercises = useExercises();
  const allEntries = useWorkoutEntries();
  const [date, setDate] = useState(todayISO);
  const [blocks, setBlocks] = useState<ExerciseBlock[]>([createBlock()]);
  const [saving, setSaving] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const usedExerciseIds = blocks
    .map((b) => b.exerciseId)
    .filter((id): id is number => id != null);

  const fetchLastWorkout = useCallback(
    async (blockKey: number, exerciseId: number) => {
      if (!user) return;
      try {
        const last = await getLastWorkoutForExercise(exerciseId, user.id);
        setBlocks((prev) =>
          prev.map((b) =>
            b.key === blockKey ? { ...b, lastWorkout: last } : b,
          ),
        );
      } catch {
        // no previous workout
      }
    },
    [user],
  );

  async function repeatLastWorkout() {
    if (!user) return;
    setLoadingTemplate(true);
    try {
      const lastDay = await getLatestWorkoutDay(user.id);
      if (lastDay.length === 0) {
        setLoadingTemplate(false);
        return;
      }
      const newBlocks = lastDay.map((entry) => createBlockFromEntry(entry));
      setBlocks(newBlocks);
    } catch {
      // failed to load
    }
    setLoadingTemplate(false);
  }

  async function applyTemplate(templateIdx: number) {
    if (!user) return;
    setLoadingTemplate(true);
    const template = TEMPLATES[templateIdx];
    const newBlocks: ExerciseBlock[] = [];

    for (const tplEx of template.exercises) {
      const exercise = exercises.find(
        (e) => e.name.toLowerCase() === tplEx.name.toLowerCase(),
      );
      let exId: number;
      if (exercise) {
        exId = exercise.id;
      } else {
        exId = await ensureExerciseExists(tplEx.name, tplEx.muscle_group, user.id);
      }
      newBlocks.push(createBlockWithExercise(exId));
    }

    setBlocks(newBlocks);
    setLoadingTemplate(false);

    for (const block of newBlocks) {
      if (block.exerciseId != null) {
        fetchLastWorkout(block.key, block.exerciseId);
      }
    }
  }

  function updateBlock(key: number, patch: Partial<ExerciseBlock>) {
    setBlocks((prev) =>
      prev.map((b) => (b.key === key ? { ...b, ...patch } : b)),
    );
  }

  function handleExerciseChange(blockKey: number, exerciseId: number) {
    updateBlock(blockKey, {
      exerciseId,
      series: buildEmptySeries(),
      lastWorkout: null,
      savedId: null,
    });
    fetchLastWorkout(blockKey, exerciseId);
  }

  function handleSeriesChange(
    blockKey: number,
    idx: number,
    updated: SeriesData,
  ) {
    setBlocks((prev) =>
      prev.map((b) =>
        b.key === blockKey
          ? { ...b, series: b.series.map((s, i) => (i === idx ? updated : s)) }
          : b,
      ),
    );
  }

  function removeBlock(key: number) {
    setBlocks((prev) => {
      const next = prev.filter((b) => b.key !== key);
      return next.length === 0 ? [createBlock()] : next;
    });
  }

  function addBlock() {
    setBlocks((prev) => [...prev, createBlock()]);
  }

  function moveBlock(key: number, direction: -1 | 1) {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.key === key);
      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      return next;
    });
  }

  const validBlocks = blocks.filter(
    (b) =>
      b.exerciseId != null &&
      b.series.some((s) => s.weight > 0 || s.reps > 0),
  );
  const canSave = validBlocks.length > 0;

  async function saveBlocks(): Promise<boolean> {
    if (!canSave || !user) return false;
    setSaving(true);

    const updatedBlocks = [...blocks];

    for (let i = 0; i < updatedBlocks.length; i++) {
      const b = updatedBlocks[i];
      if (b.exerciseId == null) continue;
      const filledSeries = b.series.filter((s) => s.weight > 0 || s.reps > 0);
      if (filledSeries.length === 0) continue;

      if (b.savedId != null) {
        await updateWorkoutEntry(b.savedId, { series: filledSeries });
      } else {
        const newId = await addWorkoutEntry(
          { date, exercise_id: b.exerciseId, series: filledSeries },
          user.id,
        );
        updatedBlocks[i] = { ...b, savedId: newId };
      }
    }

    setBlocks(updatedBlocks);
    setSaving(false);
    return true;
  }

  async function handleSave() {
    const ok = await saveBlocks();
    if (ok) {
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    }
  }

  async function handleSaveAndExit() {
    const ok = await saveBlocks();
    if (ok) router.push("/");
  }

  return (
    <div className="flex flex-1 flex-col p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Nuevo entreno</h1>
        <button
          onClick={() => router.back()}
          className="text-sm text-muted hover:text-foreground"
        >
          Cancelar
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wider text-muted">
            Fecha
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-3 text-sm font-medium text-foreground focus:border-accent focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wider text-muted">
            Cargar desde...
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={repeatLastWorkout}
              disabled={loadingTemplate}
              className="rounded-lg border border-accent/50 bg-accent/10 px-3 py-2 text-xs font-medium text-accent transition-colors hover:bg-accent/20 disabled:opacity-40"
            >
              Repetir último
            </button>
            {TEMPLATES.map((tpl, idx) => (
              <button
                key={tpl.name}
                onClick={() => applyTemplate(idx)}
                disabled={loadingTemplate}
                className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
              >
                {tpl.name}
              </button>
            ))}
          </div>
        </div>

        {blocks.map((block, blockIdx) => (
          <div
            key={block.key}
            className={`rounded-xl border p-3 ${
              block.savedId != null
                ? "border-green-500/30 bg-green-500/5"
                : "border-border bg-card/50"
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Ejercicio {blockIdx + 1}
                </span>
                {block.savedId != null && (
                  <span className="text-[9px] font-semibold uppercase text-green-400">
                    guardado
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {blocks.length > 1 && blockIdx > 0 && (
                  <button
                    onClick={() => moveBlock(block.key, -1)}
                    className="flex h-6 w-6 items-center justify-center rounded text-muted transition-colors hover:text-foreground"
                    title="Subir"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                      <path fillRule="evenodd" d="M9.47 6.47a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 1 1-1.06 1.06L10 8.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06l4.25-4.25Z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
                {blocks.length > 1 && blockIdx < blocks.length - 1 && (
                  <button
                    onClick={() => moveBlock(block.key, 1)}
                    className="flex h-6 w-6 items-center justify-center rounded text-muted transition-colors hover:text-foreground"
                    title="Bajar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                      <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0l-4.25-4.25a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
                {blocks.length > 1 && (
                  <button
                    onClick={() => removeBlock(block.key)}
                    className="ml-1 text-xs text-danger/60 transition-colors hover:text-danger"
                  >
                    Quitar
                  </button>
                )}
              </div>
            </div>

            <ExerciseSelect
              exercises={exercises}
              value={block.exerciseId}
              onChange={(id) => handleExerciseChange(block.key, id)}
              disabledIds={usedExerciseIds.filter(
                (eid) => eid !== block.exerciseId,
              )}
              frequencyMap={allEntries}
            />

            {block.lastWorkout && (
              <div className="mt-2 rounded-lg bg-accent/10 px-3 py-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-accent">
                  Última vez ({block.lastWorkout.date.split("-").reverse().join("/")}):
                </span>
                <div className="mt-1 flex gap-2">
                  {block.lastWorkout.series.map((s) => (
                    <span key={s.seriesNumber} className="text-xs tabular-nums text-accent/80">
                      {s.weight}kg&times;{s.reps}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {block.exerciseId != null && (
              <div className="mt-3 flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-wider text-muted">
                  Series (completá las que hagas)
                </span>
                {block.series.map((s, i) => (
                  <SeriesInput
                    key={s.seriesNumber}
                    series={s}
                    onChange={(updated) =>
                      handleSeriesChange(block.key, i, updated)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        <button
          onClick={addBlock}
          className="rounded-xl border border-dashed border-border py-3 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-accent"
        >
          + Agregar otro ejercicio
        </button>

        <div className="mt-2 flex gap-3">
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="flex-1 rounded-xl border border-accent bg-accent/10 py-3.5 text-sm font-bold text-accent transition-colors hover:bg-accent/20 disabled:opacity-40"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
          <button
            onClick={handleSaveAndExit}
            disabled={!canSave || saving}
            className="flex-1 rounded-xl bg-accent py-3.5 text-sm font-bold text-background transition-colors hover:bg-accent-hover disabled:opacity-40"
          >
            {saving ? "Guardando..." : "Guardar y salir"}
          </button>
        </div>

        {savedMsg && (
          <p className="text-center text-xs font-semibold text-green-400">
            Guardado correctamente
          </p>
        )}
      </div>

      <RestTimer />
    </div>
  );
}
