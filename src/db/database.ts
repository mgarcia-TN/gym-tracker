import Dexie, { type EntityTable } from "dexie";
import type { Exercise, WorkoutEntry } from "@/types";

const db = new Dexie("GymTrackerDB") as Dexie & {
  exercises: EntityTable<Exercise, "id">;
  workoutEntries: EntityTable<WorkoutEntry, "id">;
};

db.version(1).stores({
  exercises: "++id, name",
  workoutEntries: "++id, date, exerciseId",
});

db.version(2)
  .stores({
    exercises: "++id, name",
    workoutEntries: "++id, date, exerciseId",
  })
  .upgrade(async (tx) => {
    await tx.table("exercises").clear();
    await tx.table("workoutEntries").clear();
  });

db.version(3)
  .stores({
    exercises: "++id, name, muscleGroup",
    workoutEntries: "++id, date, exerciseId",
  })
  .upgrade(async (tx) => {
    await tx.table("exercises").clear();
    await tx.table("workoutEntries").clear();
  });

export { db };
