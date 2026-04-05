"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./database";
import type { Exercise, WorkoutEntry, MuscleGroup } from "@/types";

export function useExercises(): Exercise[] {
  return useLiveQuery(() => db.exercises.orderBy("name").toArray()) ?? [];
}

export function useExercise(id: number | undefined): Exercise | undefined {
  return useLiveQuery(
    () => (id != null ? db.exercises.get(id) : undefined),
    [id],
  );
}

export function useWorkoutEntries(): WorkoutEntry[] {
  return (
    useLiveQuery(() =>
      db.workoutEntries.orderBy("date").reverse().toArray(),
    ) ?? []
  );
}

export function useWorkoutsByExercise(exerciseId: number): WorkoutEntry[] {
  return (
    useLiveQuery(
      () =>
        db.workoutEntries
          .where("exerciseId")
          .equals(exerciseId)
          .sortBy("date"),
      [exerciseId],
    ) ?? []
  );
}

export async function addExercise(
  name: string,
  muscleGroup: MuscleGroup,
): Promise<number> {
  const id = await db.exercises.add({ name, muscleGroup });
  return id as number;
}

export async function updateExercise(
  id: number,
  changes: Partial<Exercise>,
): Promise<number> {
  return db.exercises.update(id, changes);
}

export async function deleteExercise(id: number): Promise<void> {
  await db.transaction("rw", db.exercises, db.workoutEntries, async () => {
    await db.workoutEntries.where("exerciseId").equals(id).delete();
    await db.exercises.delete(id);
  });
}

export async function addWorkoutEntry(
  entry: Omit<WorkoutEntry, "id">,
): Promise<number> {
  const id = await db.workoutEntries.add(entry);
  return id as number;
}

export async function deleteWorkoutEntry(id: number): Promise<void> {
  await db.workoutEntries.delete(id);
}

export async function deleteWorkoutEntriesByDate(
  date: string,
): Promise<void> {
  await db.workoutEntries.where("date").equals(date).delete();
}
