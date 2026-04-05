export type MuscleGroup =
  | "Pecho"
  | "Espalda"
  | "Bíceps"
  | "Tríceps"
  | "Hombro"
  | "Piernas";

export const MUSCLE_GROUPS: MuscleGroup[] = [
  "Pecho",
  "Espalda",
  "Bíceps",
  "Tríceps",
  "Hombro",
  "Piernas",
];

export interface SeriesData {
  seriesNumber: number;
  weight: number;
  reps: number;
}

export interface Exercise {
  id: number;
  name: string;
  muscle_group: MuscleGroup;
  user_id: string;
}

export interface WorkoutEntry {
  id: number;
  date: string;
  exercise_id: number;
  series: SeriesData[];
  user_id: string;
}
