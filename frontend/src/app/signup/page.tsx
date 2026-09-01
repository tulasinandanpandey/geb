"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import GEBLogo from "@/components/common/GEBLogo";

export default function SignupPage() {

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSignup(event: FormEvent) {

    event.preventDefault();

    setError("");
    setSuccess("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {

      setLoading(true);

      const {
        error: signupError
      } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (signupError) {
        throw signupError;
      }

      setSuccess(
        "Account created successfully. Check your email if email confirmation is enabled."
      );

      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your account."
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
              "radial-gradient(circle at 80% 15%, var(--copper-700), transparent 55%), radial-gradient(circle at 15% 85%, var(--violet), transparent 45%)",
          }}
        />
        <div className="relative z-10">
          <GEBLogo variant="dark" size="md" />
        </div>

        <div className="relative z-10 max-w-sm">
          <p className="font-display text-4xl italic leading-tight text-white/95">
            "A map-first way to buy, sell and understand land — verified before it's listed."
          </p>
        </div>

        <p className="relative z-10 text-xs text-white/40">© {new Date().getFullYear()} GEB Prop</p>
      </div>

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
            Join GEB
          </div>

          <h1 className="font-display text-5xl font-medium tracking-tight">
            Create your account.
          </h1>

          <p className="mt-4 leading-7 text-[var(--ink-soft)]">
            Start discovering properties and unlock more GEB features.
          </p>

          <form
            onSubmit={handleSignup}
            className="mt-8 rounded-[2rem] border border-[var(--stone-line)] bg-[var(--paper-raised)] p-6 shadow-xl shadow-[var(--copper-900)]/5"
          >

            <div className="space-y-5">

              <div>

                <label className="mb-2 block text-sm font-semibold">
                  Full name
                </label>

                <input
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  placeholder="Your name"
                  autoComplete="name"
                  className="w-full rounded-2xl border border-[var(--stone-line)] bg-[var(--paper)] px-4 py-3.5 text-sm outline-none transition focus:border-[var(--copper-600)] focus:bg-white"
                />

              </div>


              <div>

                <label className="mb-2 block text-sm font-semibold">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
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
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                  className="w-full rounded-2xl border border-[var(--stone-line)] bg-[var(--paper)] px-4 py-3.5 text-sm outline-none transition focus:border-[var(--copper-600)] focus:bg-white"
                />

              </div>


              <div>

                <label className="mb-2 block text-sm font-semibold">
                  Confirm password
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  className="w-full rounded-2xl border border-[var(--stone-line)] bg-[var(--paper)] px-4 py-3.5 text-sm outline-none transition focus:border-[var(--copper-600)] focus:bg-white"
                />

              </div>

            </div>


            {error && (

              <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>

            )}


            {success && (

              <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {success}
              </div>

            )}


            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ink)] px-5 py-4 font-semibold text-white transition hover:bg-[var(--copper-700)] disabled:cursor-not-allowed disabled:opacity-50"
            >

              {loading ? (

                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />

                  Creating account...

                </>

              ) : (

                "Create account"

              )}

            </button>


            <p className="mt-6 text-center text-sm text-[var(--ink-soft)]">

              Already have an account?{" "}

              <Link
                href="/login"
                className="font-semibold text-[var(--ink)] hover:underline"
              >
                Sign in
              </Link>

            </p>

          </form>
        </section>
      </div>
    </main>
  );
}
