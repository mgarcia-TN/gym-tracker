"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useExercises, addWorkoutEntry } from "@/db/hooks";
import { useAuth } from "@/components/AuthProvider";
import ExerciseSelect from "@/components/ExerciseSelect";
import SeriesInput from "@/components/SeriesInput";
import type { SeriesData } from "@/types";

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

interface ExerciseBlock {
  key: number;
  exerciseId: number | null;
  series: SeriesData[];
}

let blockKeyCounter = 0;
function createBlock(): ExerciseBlock {
  return {
    key: ++blockKeyCounter,
    exerciseId: null,
    series: buildEmptySeries(),
  };
}

export default function NewWorkoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const exercises = useExercises();
  const [date, setDate] = useState(todayISO);
  const [blocks, setBlocks] = useState<ExerciseBlock[]>([createBlock()]);
  const [saving, setSaving] = useState(false);

  const usedExerciseIds = blocks
    .map((b) => b.exerciseId)
    .filter((id): id is number => id != null);

  function updateBlock(key: number, patch: Partial<ExerciseBlock>) {
    setBlocks((prev) =>
      prev.map((b) => (b.key === key ? { ...b, ...patch } : b)),
    );
  }

  function handleExerciseChange(blockKey: number, exerciseId: number) {
    updateBlock(blockKey, { exerciseId, series: buildEmptySeries() });
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

  const validBlocks = blocks.filter(
    (b) =>
      b.exerciseId != null &&
      b.series.some((s) => s.weight > 0 || s.reps > 0),
  );
  const canSave = validBlocks.length > 0;

  async function handleSave() {
    if (!canSave || !user) return;
    setSaving(true);
    const promises = validBlocks.map((b) =>
      addWorkoutEntry(
        {
          date,
          exercise_id: b.exerciseId!,
          series: b.series.filter((s) => s.weight > 0 || s.reps > 0),
        },
        user.id,
      ),
    );
    await Promise.all(promises);
    router.push("/");
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

        {blocks.map((block, blockIdx) => (
          <div
            key={block.key}
            className="rounded-xl border border-border bg-card/50 p-3"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Ejercicio {blockIdx + 1}
              </span>
              {blocks.length > 1 && (
                <button
                  onClick={() => removeBlock(block.key)}
                  className="text-xs text-danger/60 transition-colors hover:text-danger"
                >
                  Quitar
                </button>
              )}
            </div>

            <ExerciseSelect
              exercises={exercises}
              value={block.exerciseId}
              onChange={(id) => handleExerciseChange(block.key, id)}
              disabledIds={usedExerciseIds.filter(
                (eid) => eid !== block.exerciseId,
              )}
            />

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

        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="mt-2 rounded-xl bg-accent py-3.5 text-base font-bold text-background transition-colors hover:bg-accent-hover disabled:opacity-40"
        >
          {saving ? "Guardando..." : "Guardar entreno"}
        </button>
      </div>
    </div>
  );
}
