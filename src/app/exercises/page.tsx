"use client";

import { useState } from "react";
import {
  useExercises,
  addExercise,
  updateExercise,
  deleteExercise,
} from "@/db/hooks";
import { useAuth } from "@/components/AuthProvider";
import { MUSCLE_GROUPS, type MuscleGroup } from "@/types";

export default function ExercisesPage() {
  const { user } = useAuth();
  const exercises = useExercises();
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>("Pecho");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editGroup, setEditGroup] = useState<MuscleGroup>("Pecho");

  async function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed || !user) return;
    await addExercise(trimmed, muscleGroup, user.id);
    setName("");
  }

  function startEdit(
    id: number,
    currentName: string,
    currentGroup: MuscleGroup,
  ) {
    setEditingId(id);
    setEditName(currentName);
    setEditGroup(currentGroup);
  }

  async function handleUpdate() {
    if (editingId == null) return;
    const trimmed = editName.trim();
    if (!trimmed) return;
    await updateExercise(editingId, {
      name: trimmed,
      muscle_group: editGroup,
    });
    setEditingId(null);
  }

  async function handleDelete(id: number) {
    await deleteExercise(id);
    if (editingId === id) setEditingId(null);
  }

  return (
    <div className="flex flex-1 flex-col p-4">
      <h1 className="mb-4 text-xl font-bold">Ejercicios</h1>

      <div className="mb-6 flex flex-col gap-3 rounded-xl bg-card p-3">
        <input
          type="text"
          placeholder="Nombre del ejercicio"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <select
          value={muscleGroup}
          onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}
          className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
        >
          {MUSCLE_GROUPS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          disabled={!name.trim()}
          className="rounded-lg bg-accent py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:opacity-40"
        >
          Agregar ejercicio
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {exercises.map((ex) => (
          <div
            key={ex.id}
            className="flex items-center gap-3 rounded-xl bg-card p-3"
          >
            {editingId === ex.id ? (
              <div className="flex flex-1 flex-col gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
                <select
                  value={editGroup}
                  onChange={(e) =>
                    setEditGroup(e.target.value as MuscleGroup)
                  }
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                >
                  {MUSCLE_GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdate}
                    className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-background"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <p className="text-sm font-medium">{ex.name}</p>
                  <p className="text-xs text-muted">{ex.muscle_group}</p>
                </div>
                <button
                  onClick={() =>
                    startEdit(ex.id, ex.name, ex.muscle_group)
                  }
                  className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:text-foreground"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(ex.id)}
                  className="rounded-lg border border-danger/30 px-3 py-1.5 text-xs text-danger transition-colors hover:bg-danger/10"
                >
                  Borrar
                </button>
              </>
            )}
          </div>
        ))}

        {exercises.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">
            No hay ejercicios cargados
          </p>
        )}
      </div>
    </div>
  );
}
