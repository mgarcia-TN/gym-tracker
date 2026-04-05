"use client";

import { useMemo } from "react";
import { MUSCLE_GROUPS, type Exercise, type MuscleGroup, type WorkoutEntry } from "@/types";

interface ExerciseSelectProps {
  exercises: Exercise[];
  value: number | null;
  onChange: (exerciseId: number) => void;
  disabledIds?: number[];
  frequencyMap?: WorkoutEntry[];
}

export default function ExerciseSelect({
  exercises,
  value,
  onChange,
  disabledIds = [],
  frequencyMap,
}: ExerciseSelectProps) {
  const grouped = useMemo(() => {
    const freqCount = new Map<number, number>();
    if (frequencyMap) {
      for (const entry of frequencyMap) {
        freqCount.set(entry.exercise_id, (freqCount.get(entry.exercise_id) ?? 0) + 1);
      }
    }

    const map = new Map<MuscleGroup, Exercise[]>();
    for (const g of MUSCLE_GROUPS) map.set(g, []);
    for (const ex of exercises) {
      map.get(ex.muscle_group)?.push(ex);
    }

    if (frequencyMap) {
      for (const [, list] of map) {
        list.sort((a, b) => (freqCount.get(b.id) ?? 0) - (freqCount.get(a.id) ?? 0));
      }
    }

    return map;
  }, [exercises, frequencyMap]);

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full rounded-lg border border-border bg-card px-3 py-3 text-sm font-medium text-foreground focus:border-accent focus:outline-none"
    >
      <option value="" disabled>
        Seleccionar ejercicio...
      </option>
      {MUSCLE_GROUPS.map((group) => {
        const items = grouped.get(group);
        if (!items || items.length === 0) return null;
        return (
          <optgroup key={group} label={group}>
            {items.map((ex) => (
              <option
                key={ex.id}
                value={ex.id}
                disabled={disabledIds.includes(ex.id)}
              >
                {ex.name}
              </option>
            ))}
          </optgroup>
        );
      })}
    </select>
  );
}
