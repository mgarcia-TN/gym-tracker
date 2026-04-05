"use client";

import { useEffect, useState, type ReactNode } from "react";
import { seedExercisesIfEmpty } from "@/db/seed";

export default function DbProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedExercisesIfEmpty().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
