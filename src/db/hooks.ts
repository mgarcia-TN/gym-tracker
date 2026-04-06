"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import type { Exercise, WorkoutEntry, MuscleGroup, SeriesData } from "@/types";

export function useExercises(): Exercise[] {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("exercises")
      .select("*")
      .eq("user_id", user.id)
      .order("name");
    if (data) setExercises(data as Exercise[]);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    const channel = supabase
      .channel("exercises-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "exercises" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  return exercises;
}

export function useExercise(id: number | undefined): Exercise | undefined {
  const { user } = useAuth();
  const [exercise, setExercise] = useState<Exercise | undefined>();

  useEffect(() => {
    if (!user || id == null) return;
    const supabase = createClient();
    supabase
      .from("exercises")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setExercise(data as Exercise);
      });
  }, [user, id]);

  return exercise;
}

export function useWorkoutEntries(): WorkoutEntry[] {
  const { user } = useAuth();
  const [entries, setEntries] = useState<WorkoutEntry[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("workout_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .order("sort_order")
      .order("id");
    if (data) setEntries(data as WorkoutEntry[]);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    const channel = supabase
      .channel("workouts-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workout_entries" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  return entries;
}

export function useWorkoutsByExercise(exerciseId: number): WorkoutEntry[] {
  const { user } = useAuth();
  const [entries, setEntries] = useState<WorkoutEntry[]>([]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("workout_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("exercise_id", exerciseId)
      .order("date")
      .then(({ data }) => {
        if (data) setEntries(data as WorkoutEntry[]);
      });
  }, [user, exerciseId]);

  return entries;
}

export async function addExercise(
  name: string,
  muscleGroup: MuscleGroup,
  userId: string,
): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("exercises")
    .insert({ name, muscle_group: muscleGroup, user_id: userId })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateExercise(
  id: number,
  changes: { name?: string; muscle_group?: MuscleGroup },
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("exercises")
    .update(changes)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteExercise(id: number): Promise<void> {
  const supabase = createClient();
  await supabase.from("workout_entries").delete().eq("exercise_id", id);
  const { error } = await supabase.from("exercises").delete().eq("id", id);
  if (error) throw error;
}

export async function addWorkoutEntry(
  entry: { date: string; exercise_id: number; series: SeriesData[]; sort_order?: number },
  userId: string,
): Promise<number> {
  const supabase = createClient();
  const sortOrder = entry.sort_order ?? 0;
  const { data, error } = await supabase
    .from("workout_entries")
    .insert({ date: entry.date, exercise_id: entry.exercise_id, series: entry.series, sort_order: sortOrder, user_id: userId })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function deleteWorkoutEntry(id: number): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("workout_entries")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function updateWorkoutEntry(
  id: number,
  changes: { series: SeriesData[] },
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("workout_entries")
    .update(changes)
    .eq("id", id);
  if (error) throw error;
}

export async function getLastWorkoutForExercise(
  exerciseId: number,
  userId: string,
): Promise<WorkoutEntry | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("workout_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("exercise_id", exerciseId)
    .order("date", { ascending: false })
    .limit(1)
    .single();
  return (data as WorkoutEntry) ?? null;
}

export async function getMaxWeightForExercise(
  exerciseId: number,
  userId: string,
): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase
    .from("workout_entries")
    .select("series")
    .eq("user_id", userId)
    .eq("exercise_id", exerciseId);

  if (!data) return 0;
  let max = 0;
  for (const row of data) {
    const series = row.series as SeriesData[];
    for (const s of series) {
      if (s.weight > max) max = s.weight;
    }
  }
  return max;
}

const ensureLocks = new Map<string, Promise<number>>();

export function ensureExerciseExists(
  name: string,
  muscleGroup: MuscleGroup,
  userId: string,
): Promise<number> {
  const key = `${userId}:${name.toLowerCase().trim()}`;
  const existing = ensureLocks.get(key);
  if (existing) return existing;

  const promise = (async () => {
    const supabase = createClient();
    const { data: found } = await supabase
      .from("exercises")
      .select("id")
      .eq("user_id", userId)
      .eq("name", name)
      .limit(1)
      .single();

    if (found) return found.id;

    const { data, error } = await supabase
      .from("exercises")
      .insert({ name, muscle_group: muscleGroup, user_id: userId })
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  })().finally(() => {
    ensureLocks.delete(key);
  });

  ensureLocks.set(key, promise);
  return promise;
}

export async function getPreviousWorkoutForExercise(
  exerciseId: number,
  userId: string,
  beforeDate: string,
): Promise<WorkoutEntry | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("workout_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("exercise_id", exerciseId)
    .lt("date", beforeDate)
    .order("date", { ascending: false })
    .limit(1)
    .single();
  return (data as WorkoutEntry) ?? null;
}

export async function getLatestWorkoutDay(
  userId: string,
): Promise<WorkoutEntry[]> {
  const supabase = createClient();
  const { data: latest } = await supabase
    .from("workout_entries")
    .select("date")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(1)
    .single();

  if (!latest) return [];

  const { data } = await supabase
    .from("workout_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("date", latest.date)
    .order("sort_order")
    .order("id");

  return (data as WorkoutEntry[]) ?? [];
}

export async function swapWorkoutEntryOrder(
  idA: number,
  sortA: number,
  idB: number,
  sortB: number,
): Promise<void> {
  const supabase = createClient();
  await supabase.from("workout_entries").update({ sort_order: sortB }).eq("id", idA);
  await supabase.from("workout_entries").update({ sort_order: sortA }).eq("id", idB);
}

export async function deleteWorkoutEntriesByDate(
  date: string,
  userId: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("workout_entries")
    .delete()
    .eq("date", date)
    .eq("user_id", userId);
  if (error) throw error;
}
