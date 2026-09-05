"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin";

  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [shakeKey, setShakeKey] = React.useState(0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Wrong password.");
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wrong password.");
      setShakeKey((k) => k + 1);
      setPassword("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      key={shakeKey}
      onSubmit={submit}
      className={`w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 ${
        error ? "t-shake" : "t-pop-in"
      }`}
    >
      <span className="grid size-11 place-items-center rounded-full border border-[var(--border)] bg-black/40">
        <Lock className="size-4 text-[var(--accent)]" />
      </span>
      <h1 className="mt-5 text-2xl">Door staff</h1>
      <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
        Sign in to approve payments and scan tickets.
      </p>

      <div className="mt-7">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className="mt-4 text-sm text-[var(--destructive)]">{error}</p>
      )}

      <Button type="submit" variant="accent" disabled={busy} className="mt-6 w-full">
        {busy && <Loader2 className="animate-spin" />}
        {busy ? "Checking…" : "Sign in"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <React.Suspense fallback={null}>
        <LoginForm />
      </React.Suspense>
    </div>
  );
}
