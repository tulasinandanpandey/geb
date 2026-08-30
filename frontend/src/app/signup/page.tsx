"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

import { supabase } from "@/lib/supabase/client";

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

    <main className="min-h-screen bg-[#f7f7f5] text-zinc-950">

      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">

        <Link
          href="/"
          className="flex items-center gap-2"
        >

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 text-sm font-bold text-white">
            G
          </div>

          <span className="text-xl font-bold tracking-tight">
            GEB
          </span>

        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold transition hover:bg-zinc-100"
        >
          <ArrowLeft size={15} />
          Back to GEB
        </Link>

      </nav>


      <section className="mx-auto flex max-w-md px-6 pb-20 pt-16">

        <div className="w-full">

          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium shadow-sm">

            <Sparkles size={15} />

            Join GEB

          </div>


          <h1 className="font-serif text-5xl font-medium tracking-tight">
            Create your account.
          </h1>

          <p className="mt-4 leading-7 text-zinc-500">
            Start discovering properties and unlock more GEB features.
          </p>


          <form
            onSubmit={handleSignup}
            className="mt-8 rounded-[2rem] border border-black/10 bg-white p-6 shadow-xl shadow-black/5"
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
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm outline-none transition focus:border-zinc-950 focus:bg-white"
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
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm outline-none transition focus:border-zinc-950 focus:bg-white"
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
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm outline-none transition focus:border-zinc-950 focus:bg-white"
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
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm outline-none transition focus:border-zinc-950 focus:bg-white"
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
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 py-4 font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
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


            <p className="mt-6 text-center text-sm text-zinc-500">

              Already have an account?{" "}

              <Link
                href="/login"
                className="font-semibold text-zinc-950 hover:underline"
              >
                Sign in
              </Link>

            </p>

          </form>

        </div>

      </section>

    </main>

  );
}
