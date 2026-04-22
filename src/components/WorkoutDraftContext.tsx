"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import type { SeriesData, WorkoutEntry } from "@/types";

const SERIES_COUNT = 4;
const STORAGE_KEY = "workout-draft";

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function buildEmptySeries(): SeriesData[] {
  return Array.from({ length: SERIES_COUNT }, (_, i) => ({
    seriesNumber: i + 1,
    weight: 0,
    reps: 0,
  }));
}

export function padSeries(series: SeriesData[]): SeriesData[] {
  const padded = [...series];
  while (padded.length < SERIES_COUNT) {
    padded.push({ seriesNumber: padded.length + 1, weight: 0, reps: 0 });
  }
  return padded;
}

export interface ExerciseBlock {
  key: number;
  exerciseId: number | null;
  series: SeriesData[];
  lastWorkout: WorkoutEntry | null;
  savedId: number | null;
}

let blockKeyCounter = Date.now();

export function createBlock(): ExerciseBlock {
  return {
    key: ++blockKeyCounter,
    exerciseId: null,
    series: buildEmptySeries(),
    lastWorkout: null,
    savedId: null,
  };
}

export function createBlockWithExercise(exerciseId: number): ExerciseBlock {
  return {
    key: ++blockKeyCounter,
    exerciseId,
    series: buildEmptySeries(),
    lastWorkout: null,
    savedId: null,
  };
}

export function createBlockFromEntry(entry: WorkoutEntry): ExerciseBlock {
  return {
    key: ++blockKeyCounter,
    exerciseId: entry.exercise_id,
    series: padSeries(entry.series),
    lastWorkout: entry,
    savedId: null,
  };
}

interface DraftState {
  date: string;
  blocks: ExerciseBlock[];
}

interface WorkoutDraftContextValue {
  date: string;
  setDate: (d: string) => void;
  blocks: ExerciseBlock[];
  setBlocks: (updater: ExerciseBlock[] | ((prev: ExerciseBlock[]) => ExerciseBlock[])) => void;
  clearDraft: () => void;
  hasDraft: boolean;
}

const WorkoutDraftContext = createContext<WorkoutDraftContextValue | null>(null);

function saveDraft(state: DraftState): void {
  try {
    const serializable = {
      date: state.date,
      blocks: state.blocks.map((b) => ({
        key: b.key,
        exerciseId: b.exerciseId,
        series: b.series,
        savedId: b.savedId,
      })),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch {
    // quota exceeded or unavailable
  }
}

function loadDraft(): DraftState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      date: string;
      blocks: Array<{
        key: number;
        exerciseId: number | null;
        series: SeriesData[];
        savedId: number | null;
      }>;
    };
    if (!parsed.date || !Array.isArray(parsed.blocks) || parsed.blocks.length === 0) return null;
    return {
      date: parsed.date,
      blocks: parsed.blocks.map((b) => ({
        key: b.key,
        exerciseId: b.exerciseId,
        series: b.series,
        lastWorkout: null,
        savedId: b.savedId,
      })),
    };
  } catch {
    return null;
  }
}

export function WorkoutDraftProvider({ children }: { children: ReactNode }) {
  const [date, setDateRaw] = useState(todayISO);
  const [blocks, setBlocksRaw] = useState<ExerciseBlock[]>(() => [createBlock()]);
  const initialized = useRef(false);

  useEffect(() => {
    const saved = loadDraft();
    if (saved) {
      setDateRaw(saved.date);
      setBlocksRaw(saved.blocks);
      blockKeyCounter = Math.max(blockKeyCounter, ...saved.blocks.map((b) => b.key)) + 1;
    }
    initialized.current = true;
  }, []);

  useEffect(() => {
    if (!initialized.current) return;
    saveDraft({ date, blocks });
  }, [date, blocks]);

  const setDate = useCallback((d: string) => {
    setDateRaw(d);
  }, []);

  const setBlocks = useCallback(
    (updater: ExerciseBlock[] | ((prev: ExerciseBlock[]) => ExerciseBlock[])) => {
      setBlocksRaw(updater);
    },
    [],
  );

  const clearDraft = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setDateRaw(todayISO());
    setBlocksRaw([createBlock()]);
  }, []);

  const hasDraft =
    blocks.length > 1 ||
    blocks[0]?.exerciseId != null ||
    blocks[0]?.series.some((s) => s.weight > 0 || s.reps > 0) === true;

  return (
    <WorkoutDraftContext.Provider value={{ date, setDate, blocks, setBlocks, clearDraft, hasDraft }}>
      {children}
    </WorkoutDraftContext.Provider>
  );
}

export function useWorkoutDraft(): WorkoutDraftContextValue {
  const ctx = useContext(WorkoutDraftContext);
  if (!ctx) throw new Error("useWorkoutDraft must be used within WorkoutDraftProvider");
  return ctx;
}
