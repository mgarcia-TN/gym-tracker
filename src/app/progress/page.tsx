"use client";

import Link from "next/link";
import { useExercises } from "@/db/hooks";

export default function ProgressPage() {
  const exercises = useExercises();

  return (
    <div className="flex flex-1 flex-col p-4">
      <h1 className="mb-4 text-xl font-bold">Progreso</h1>

      {exercises.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          Primero cargá ejercicios para ver tu progreso
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="mb-2 text-sm text-muted">
            Elegí un ejercicio para ver tu evolución:
          </p>
          {exercises.map((ex) => (
            <Link
              key={ex.id}
              href={`/progress/${ex.id}`}
              className="flex items-center justify-between rounded-xl bg-card p-4 transition-colors hover:bg-card-hover"
            >
              <span className="text-sm font-medium">{ex.name}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5 text-muted"
              >
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
