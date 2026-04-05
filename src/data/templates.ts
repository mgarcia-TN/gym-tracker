import type { MuscleGroup } from "@/types";

export interface WorkoutTemplate {
  name: string;
  exercises: { name: string; muscle_group: MuscleGroup }[];
}

export const TEMPLATES: WorkoutTemplate[] = [
  {
    name: "Pecho - Bíceps - Hombro",
    exercises: [
      { name: "Pecho inclinado con barra asistida", muscle_group: "Pecho" },
      { name: "Pecho plano con mancuernas", muscle_group: "Pecho" },
      { name: "Curl de bíceps barra W", muscle_group: "Bíceps" },
      { name: "Martillo con mancuernas", muscle_group: "Bíceps" },
      { name: "Vuelos laterales con polea", muscle_group: "Hombro" },
      { name: "Máquina de empuje pecho", muscle_group: "Pecho" },
    ],
  },
  {
    name: "Espalda - Tríceps",
    exercises: [
      { name: "Jalones espalda con barra", muscle_group: "Espalda" },
      { name: "Jalón a un brazo en polea", muscle_group: "Espalda" },
      { name: "Press francés con mancuernas", muscle_group: "Tríceps" },
      { name: "Extensión de tríceps en polea", muscle_group: "Tríceps" },
      { name: "Pull over", muscle_group: "Espalda" },
      { name: "Vuelos laterales con polea", muscle_group: "Hombro" },
    ],
  },
  {
    name: "Pierna - Hombro",
    exercises: [
      { name: "Sentadilla barra asistida", muscle_group: "Piernas" },
      { name: "Prensa", muscle_group: "Piernas" },
      { name: "Press militar barra", muscle_group: "Hombro" },
      { name: "Vuelos laterales con polea", muscle_group: "Hombro" },
      { name: "Extensiones de cuádriceps máquina", muscle_group: "Piernas" },
    ],
  },
  {
    name: "Full body",
    exercises: [
      { name: "Pecho inclinado con barra asistida", muscle_group: "Pecho" },
      { name: "Pecho plano con mancuernas", muscle_group: "Pecho" },
      { name: "Jalones espalda con barra", muscle_group: "Espalda" },
      { name: "Jalón a un brazo en polea", muscle_group: "Espalda" },
      { name: "Curl de bíceps barra W", muscle_group: "Bíceps" },
      { name: "Press francés con mancuernas", muscle_group: "Tríceps" },
    ],
  },
];
