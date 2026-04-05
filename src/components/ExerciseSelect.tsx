"use client";

import { useMemo } from "react";
import { MUSCLE_GROUPS, type Exercise, type MuscleGroup } from "@/types";

interface ExerciseSelectProps {
  exercises: Exercise[];
  value: number | null;
  onChange: (exerciseId: number) => void;
  disabledIds?: number[];
}

export default function ExerciseSelect({
  exercises,
  value,
  onChange,
  disabledIds = [],
}: ExerciseSelectProps) {
  const grouped = useMemo(() => {
    const map = new Map<MuscleGroup, Exercise[]>();
    for (const g of MUSCLE_GROUPS) map.set(g, []);
    for (const ex of exercises) {
      map.get(ex.muscleGroup)?.push(ex);
    }
    return map;
  }, [exercises]);

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
                disabled={disabledIds.includes(ex.id!)}
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
