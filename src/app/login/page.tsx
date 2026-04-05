"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError("");
    setSuccess("");

    const supabase = createClient();

    if (isRegister) {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (signUpError) {
        setError(signUpError.message);
      } else {
        setSuccess("Cuenta creada. Revisá tu email para confirmar, o probá iniciar sesión.");
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(
          signInError.message === "Invalid login credentials"
            ? "Email o contraseña incorrectos"
            : signInError.message,
        );
      }
    }

    setLoading(false);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-2">
        <span className="text-5xl">🏋️</span>
        <h1 className="text-2xl font-bold">Gym Tracker</h1>
        <p className="text-center text-sm text-muted">
          {isRegister ? "Creá tu cuenta" : "Iniciá sesión para continuar"}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-xs flex-col gap-3"
      >
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={isRegister ? "new-password" : "current-password"}
          required
          minLength={6}
          className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
        />

        {error && (
          <p className="text-center text-xs text-red-400">{error}</p>
        )}
        {success && (
          <p className="text-center text-xs text-green-400">{success}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-accent py-3.5 text-sm font-bold text-background transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {loading
            ? "Cargando..."
            : isRegister
              ? "Crear cuenta"
              : "Iniciar sesión"}
        </button>
      </form>

      <button
        onClick={() => {
          setIsRegister((v) => !v);
          setError("");
          setSuccess("");
        }}
        className="text-xs text-muted transition-colors hover:text-foreground"
      >
        {isRegister
          ? "Ya tenés cuenta? Iniciá sesión"
          : "No tenés cuenta? Registrate"}
      </button>
    </div>
  );
}
