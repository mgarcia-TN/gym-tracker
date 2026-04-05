"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const PRESETS = [60, 90, 120];

export default function RestTimer() {
  const [isOpen, setIsOpen] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<AudioContext | null>(null);

  const playBeep = useCallback(() => {
    try {
      const ctx = audioRef.current ?? new AudioContext();
      audioRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // AudioContext not available
    }
  }, []);

  useEffect(() => {
    if (running && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            setRunning(false);
            playBeep();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, seconds, playBeep]);

  function startTimer(secs: number) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSeconds(secs);
    setRunning(true);
  }

  function stopTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setSeconds(0);
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = `${mins}:${String(secs).padStart(2, "0")}`;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-card border border-border text-muted shadow-lg transition-colors hover:text-foreground"
        title="Timer de descanso"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 left-4 z-40 flex flex-col items-center gap-2 rounded-2xl bg-card border border-border p-4 shadow-xl">
      <div className="flex items-center justify-between w-full">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          Descanso
        </span>
        <button
          onClick={() => { stopTimer(); setIsOpen(false); }}
          className="text-xs text-muted hover:text-foreground"
        >
          &times;
        </button>
      </div>

      <span className={`text-3xl font-bold tabular-nums ${running ? "text-accent" : seconds === 0 ? "text-muted" : "text-foreground"}`}>
        {display}
      </span>

      {!running && seconds === 0 && (
        <div className="flex gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => startTimer(p)}
              className="rounded-lg bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/25"
            >
              {p}s
            </button>
          ))}
        </div>
      )}

      {(running || seconds > 0) && (
        <button
          onClick={stopTimer}
          className="rounded-lg bg-danger/15 px-4 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-danger/25"
        >
          Parar
        </button>
      )}
    </div>
  );
}
