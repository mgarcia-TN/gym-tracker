"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const PRESETS = [60, 90, 120, 150, 180];

function requestNotificationPermission() {
  if (typeof Notification !== "undefined" && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

export default function RestTimer() {
  const [isOpen, setIsOpen] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const endTimeRef = useRef<number>(0);
  const bgTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runIdRef = useRef(0);

  const notifyDone = useCallback(() => {
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
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // AudioContext not available
    }

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([300, 150, 300, 150, 300]);
    }

    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        new Notification("Descanso terminado", {
          body: "A meterle de nuevo",
          icon: "/icon-192x192.png",
          tag: "rest-timer",
        });
      } catch {
        // Notification failed
      }
    }
  }, []);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  function clearTimers() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (bgTimeoutRef.current) {
      clearTimeout(bgTimeoutRef.current);
      bgTimeoutRef.current = null;
    }
  }

  function startTimer(secs: number) {
    clearTimers();
    const id = ++runIdRef.current;
    endTimeRef.current = Date.now() + secs * 1000;
    setSeconds(secs);
    setRunning(true);

    bgTimeoutRef.current = setTimeout(() => {
      if (runIdRef.current !== id) return;
      clearTimers();
      setRunning(false);
      setSeconds(0);
      notifyDone();
    }, secs * 1000);

    intervalRef.current = setInterval(() => {
      if (runIdRef.current !== id) return;
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      if (remaining <= 0) {
        clearTimers();
        setSeconds(0);
        setRunning(false);
        notifyDone();
      } else {
        setSeconds(remaining);
      }
    }, 250);
  }

  function stopTimer() {
    runIdRef.current++;
    clearTimers();
    setRunning(false);
    setSeconds(0);
  }

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

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
        <div className="flex flex-wrap justify-center gap-2">
          {PRESETS.map((p) => {
            const m = Math.floor(p / 60);
            const s = p % 60;
            const label = s === 0 ? `${m}:00` : `${m}:${String(s).padStart(2, "0")}`;
            return (
              <button
                key={p}
                onClick={() => startTimer(p)}
                className="rounded-lg bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/25"
              >
                {label}
              </button>
            );
          })}
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
