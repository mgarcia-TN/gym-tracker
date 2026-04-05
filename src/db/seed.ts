import { createClient } from "@/lib/supabase";
import type { MuscleGroup } from "@/types";

const DEFAULT_EXERCISES: { name: string; muscle_group: MuscleGroup }[] = [
  { name: "Pecho plano con barra", muscle_group: "Pecho" },
  { name: "Pecho plano con barra asistida", muscle_group: "Pecho" },
  { name: "Pecho plano con mancuernas", muscle_group: "Pecho" },
  { name: "Pecho inclinado con barra asistida", muscle_group: "Pecho" },
  { name: "Pecho inclinado con mancuernas", muscle_group: "Pecho" },
  { name: "Aperturas en polea", muscle_group: "Pecho" },
  { name: "Máquina de empuje pecho", muscle_group: "Pecho" },
  { name: "Curl de bíceps barra W", muscle_group: "Bíceps" },
  { name: "Curl de bíceps con mancuerna", muscle_group: "Bíceps" },
  { name: "Martillo con mancuernas", muscle_group: "Bíceps" },
  { name: "Curl de bíceps con polea a una mano", muscle_group: "Bíceps" },
  { name: "Jalones espalda con barra", muscle_group: "Espalda" },
  { name: "Jalón a un brazo en polea", muscle_group: "Espalda" },
  { name: "Pull over", muscle_group: "Espalda" },
  { name: "Extensión de tríceps en polea", muscle_group: "Tríceps" },
  { name: "Extensión de tríceps trasnuca en polea", muscle_group: "Tríceps" },
  { name: "Press francés con mancuernas", muscle_group: "Tríceps" },
  { name: "Vuelos laterales con mancuerna", muscle_group: "Hombro" },
  { name: "Vuelos laterales con polea", muscle_group: "Hombro" },
  { name: "Fondos", muscle_group: "Tríceps" },
  { name: "Dominadas", muscle_group: "Espalda" },
  { name: "Sentadilla barra asistida", muscle_group: "Piernas" },
  { name: "Prensa", muscle_group: "Piernas" },
  { name: "Press militar barra", muscle_group: "Hombro" },
  { name: "Extensiones de cuádriceps máquina", muscle_group: "Piernas" },
];

let seeded = false;

export async function seedExercisesIfEmpty(userId: string): Promise<void> {
  if (seeded) return;
  seeded = true;

  const supabase = createClient();

  const { count } = await supabase
    .from("exercises")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (count === 0) {
    const rows = DEFAULT_EXERCISES.map((e) => ({ ...e, user_id: userId }));
    await supabase.from("exercises").insert(rows);
  }
}

export async function deduplicateExercises(userId: string): Promise<void> {
  const supabase = createClient();

  const { data: allExercises } = await supabase
    .from("exercises")
    .select("*")
    .eq("user_id", userId)
    .order("id");

  if (!allExercises || allExercises.length === 0) return;

  const seen = new Map<string, number>();
  const dupeIds: number[] = [];

  for (const ex of allExercises) {
    const key = ex.name.toLowerCase().trim();
    if (seen.has(key)) {
      dupeIds.push(ex.id);
      const keepId = seen.get(key)!;
      await supabase
        .from("workout_entries")
        .update({ exercise_id: keepId })
        .eq("exercise_id", ex.id)
        .eq("user_id", userId);
    } else {
      seen.set(key, ex.id);
    }
  }

  if (dupeIds.length > 0) {
    await supabase.from("exercises").delete().in("id", dupeIds);
  }
}
