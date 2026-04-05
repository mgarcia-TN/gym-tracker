"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checking, setChecking] = useState(true);

  const establishSession = useCallback(async () => {
    const supabase = createClient();

    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!sessionError) {
          setSessionReady(true);
          setChecking(false);
          return;
        }
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setSessionReady(true);
        setChecking(false);
        subscription.unsubscribe();
      }
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setSessionReady(true);
      setChecking(false);
      subscription.unsubscribe();
      return;
    }

    setTimeout(() => {
      setChecking(false);
    }, 4000);
  }, []);

  useEffect(() => {
    establishSession();
  }, [establishSession]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => router.replace("/"), 2000);
    }
  }

  if (checking) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <span className="text-5xl">⚠️</span>
        <h1 className="text-xl font-bold">Link expirado o inválido</h1>
        <p className="text-center text-sm text-muted">
          Pedí un nuevo link desde la pantalla de login.
        </p>
        <button
          onClick={() => router.replace("/login")}
          className="rounded-xl bg-accent px-6 py-3 text-sm font-bold text-background transition-colors hover:bg-accent-hover"
        >
          Ir al login
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <span className="text-5xl">✅</span>
        <h1 className="text-xl font-bold">Contraseña actualizada</h1>
        <p className="text-sm text-muted">Redirigiendo...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-2">
        <span className="text-5xl">🔑</span>
        <h1 className="text-2xl font-bold">Nueva contraseña</h1>
        <p className="text-center text-sm text-muted">
          Elegí tu nueva contraseña
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-xs flex-col gap-3"
      >
        <input
          type="password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          minLength={6}
          className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <input
          type="password"
          placeholder="Confirmar contraseña"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
          minLength={6}
          className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
        />

        {error && (
          <p className="text-center text-xs text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-accent py-3.5 text-sm font-bold text-background transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar contraseña"}
        </button>
      </form>
    </div>
  );
}
