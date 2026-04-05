"use client";

import Link from "next/link";
import type { WorkoutEntry, Exercise, MuscleGroup } from "@/types";

interface WorkoutDayCardProps {
  date: string;
  entries: WorkoutEntry[];
  exerciseMap: Map<number, Exercise>;
}

const GROUP_COLORS: Record<MuscleGroup, string> = {
  Pecho: "bg-red-500/15 text-red-400",
  Espalda: "bg-blue-500/15 text-blue-400",
  Bíceps: "bg-amber-500/15 text-amber-400",
  Tríceps: "bg-purple-500/15 text-purple-400",
  Hombro: "bg-cyan-500/15 text-cyan-400",
  Piernas: "bg-green-500/15 text-green-400",
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
  const dayName = dateObj.toLocaleDateString("es-AR", { weekday: "long" });
  const capitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  return `${capitalized} ${d}/${m}/${y}`;
}

export default function WorkoutDayCard({
  date,
  entries,
  exerciseMap,
}: WorkoutDayCardProps) {
  const muscleGroups = [
    ...new Set(
      entries
        .map((e) => exerciseMap.get(e.exerciseId)?.muscleGroup)
        .filter((g): g is MuscleGroup => g != null),
    ),
  ];

  return (
    <Link
      href={`/workout/${date}`}
      className="flex items-center justify-between rounded-xl bg-card p-4 transition-colors hover:bg-card-hover active:bg-card-hover"
    >
      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold">{formatDate(date)}</p>
        <div className="flex flex-wrap gap-1.5">
          {muscleGroups.map((group) => (
            <span
              key={group}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${GROUP_COLORS[group]}`}
            >
              {group}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1 text-muted">
        <span className="text-xs">
          {entries.length} ej.
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
        >
          <path
            fillRule="evenodd"
            d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </Link>
  );
}
