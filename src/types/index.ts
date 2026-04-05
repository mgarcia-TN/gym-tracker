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
  id?: number;
  name: string;
  muscleGroup: MuscleGroup;
}

export interface WorkoutEntry {
  id?: number;
  date: string;
  exerciseId: number;
  series: SeriesData[];
}
