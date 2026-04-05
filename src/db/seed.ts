import { db } from "./database";
import type { Exercise, MuscleGroup } from "@/types";

const DEFAULT_EXERCISES: Omit<Exercise, "id">[] = [
  { name: "Pecho plano con barra", muscleGroup: "Pecho" },
  { name: "Pecho plano con barra asistida", muscleGroup: "Pecho" },
  { name: "Pecho plano con mancuernas", muscleGroup: "Pecho" },
  { name: "Pecho inclinado con barra asistida", muscleGroup: "Pecho" },
  { name: "Pecho inclinado con mancuernas", muscleGroup: "Pecho" },
  { name: "Aperturas en polea", muscleGroup: "Pecho" },
  { name: "Máquina de empuje pecho", muscleGroup: "Pecho" },
  { name: "Curl de bíceps barra W", muscleGroup: "Bíceps" },
  { name: "Curl de bíceps con mancuerna", muscleGroup: "Bíceps" },
  { name: "Martillo con mancuernas", muscleGroup: "Bíceps" },
  { name: "Curl de bíceps con polea a una mano", muscleGroup: "Bíceps" },
  { name: "Jalones espalda con barra", muscleGroup: "Espalda" },
  { name: "Jalón a un brazo en polea", muscleGroup: "Espalda" },
  { name: "Pull over", muscleGroup: "Espalda" },
  { name: "Extensión de tríceps en polea", muscleGroup: "Tríceps" },
  { name: "Extensión de tríceps trasnuca en polea", muscleGroup: "Tríceps" },
  { name: "Press francés con mancuernas", muscleGroup: "Tríceps" },
  { name: "Vuelos laterales con mancuerna", muscleGroup: "Hombro" },
  { name: "Vuelos laterales con polea", muscleGroup: "Hombro" },
  { name: "Fondos", muscleGroup: "Tríceps" },
  { name: "Dominadas", muscleGroup: "Espalda" },
];

export async function seedExercisesIfEmpty(): Promise<void> {
  const count = await db.exercises.count();
  if (count === 0) {
    await db.exercises.bulkAdd(DEFAULT_EXERCISES);
  }
}
