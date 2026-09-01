"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, ShieldCheck, MapPinned, Sparkles } from "lucide-react";

import { supabase } from "@/lib/supabase/client";

import GEBLogo from "@/components/common/GEBLogo";

export default function LoginPage() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent) {

    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {

      setLoading(true);

      const {
        error: loginError
      } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (loginError) {
        throw loginError;
      }

      window.location.href = "/";

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in."
      );

    } finally {

      setLoading(false);

    }
  }

  return (
    <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)] lg:flex">
      {/* Editorial brand panel */}
      <div className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-[var(--ink)] px-12 py-10 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(circle at 20% 15%, var(--copper-700), transparent 55%), radial-gradient(circle at 85% 80%, var(--violet), transparent 45%)",
          }}
        />
        <div className="relative z-10">
          <GEBLogo variant="dark" size="md" />
        </div>

        <div className="relative z-10 max-w-sm">
          <p className="font-display text-4xl italic leading-tight text-white/95">
            "Every listing verified on‑site, before it ever reaches you."
          </p>
          <div className="mt-8 space-y-4 text-sm text-white/70">
            <div className="flex items-center gap-3">
              <ShieldCheck size={18} className="text-[var(--copper-400)]" />
              <span>GPS-geofenced video verification on every property</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPinned size={18} className="text-[var(--copper-400)]" />
              <span>Location intelligence for schools, transit and growth</span>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/40">© {new Date().getFullYear()} GEB Prop</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col">
        <nav className="mx-auto flex w-full max-w-md items-center justify-between px-6 py-8">
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <img src="/geb-logo.png" alt="GEB Prop" className="h-8 w-auto object-contain" />
          </Link>
          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-2 rounded-full border border-[var(--stone-line)] bg-[var(--paper-raised)] px-4 py-2 text-sm font-semibold transition hover:border-[var(--copper-400)]"
          >
            <ArrowLeft size={15} />
            Back to GEB
          </Link>
        </nav>

        <section className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-16">
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--stone-line)] bg-[var(--paper-raised)] px-4 py-2 text-sm font-medium">
            <Sparkles size={15} className="text-[var(--violet)]" />
            Welcome back
          </div>

          <h1 className="font-display text-5xl font-medium tracking-tight">
            Sign in to GEB.
          </h1>

          <p className="mt-4 leading-7 text-[var(--ink-soft)]">
            Continue exploring properties and your GEB account.
          </p>

          <form
            onSubmit={handleLogin}
            className="mt-8 rounded-[2rem] border border-[var(--stone-line)] bg-[var(--paper-raised)] p-6 shadow-xl shadow-[var(--copper-900)]/5"
          >
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full rounded-2xl border border-[var(--stone-line)] bg-[var(--paper)] px-4 py-3.5 text-sm outline-none transition focus:border-[var(--copper-600)] focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-[var(--stone-line)] bg-[var(--paper)] px-4 py-3.5 text-sm outline-none transition focus:border-[var(--copper-600)] focus:bg-white"
                />
              </div>
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ink)] px-5 py-4 font-semibold text-white transition hover:bg-[var(--copper-700)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>

            <p className="mt-6 text-center text-sm text-[var(--ink-soft)]">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-semibold text-[var(--ink)] hover:underline">
                Create one
              </Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
