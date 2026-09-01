"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Search, Store, Users } from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";

type Role = "buyer" | "seller" | "broker";

const capabilities: {
  role: Role;
  title: string;
  description: string;
  icon: typeof Search;
}[] = [
  {
    role: "buyer",
    title: "Buy property",
    description: "Discover, compare and analyze properties.",
    icon: Search,
  },
  {
    role: "seller",
    title: "Sell property",
    description: "List and manage your properties on GEB.",
    icon: Store,
  },
  {
    role: "broker",
    title: "Broker services",
    description: "Connect buyers and sellers and manage leads.",
    icon: Users,
  },
];

export default function CapabilitiesPage() {
  const { user, roles, loading } = useAuth();

  const [selectedRoles, setSelectedRoles] =
    useState<Role[]>([]);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    if (!loading) {
      setSelectedRoles(roles);
    }
  }, [roles, loading]);

  function toggleRole(role: Role) {
    setSelectedRoles((current) => {
      if (current.includes(role)) {
        return current.filter(
          (item) => item !== role
        );
      }

      return [...current, role];
    });
  }

  async function saveCapabilities() {
    if (!user) {
      return;
    }

    if (selectedRoles.length === 0) {
      setMessage(
        "Please select at least one capability."
      );
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const { error: deleteError } =
        await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", user.id);

      if (deleteError) {
        throw deleteError;
      }

      const rows = selectedRoles.map((role) => ({
        user_id: user.id,
        role,
      }));

      const { error: insertError } =
        await supabase
          .from("user_roles")
          .insert(rows);

      if (insertError) {
        throw insertError;
      }

      setMessage(
        "Your GEB capabilities have been saved."
      );
    } catch (error) {
      console.error(
        "Unable to save capabilities:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save capabilities."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--paper)]">
        <p className="text-sm font-medium text-[var(--ink-soft)]">
          Loading your account...
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--paper)] px-6">
        <div className="text-center">
          <h1 className="font-display text-4xl">
            Sign in to continue
          </h1>

          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-semibold text-white"
          >
            Sign in
            <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--paper)] px-6 py-12 text-[var(--ink)]">
      <div className="mx-auto max-w-3xl">

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)]"
        >
          ← Back to GEB
        </Link>

        <div className="mt-12">

          <div className="mb-6 inline-flex rounded-full border border-[var(--stone-line)] bg-[var(--paper-raised)] px-4 py-2 text-sm font-medium shadow-sm">
            GEB Account
          </div>

          <h1 className="font-display text-5xl font-medium tracking-tight md:text-6xl">
            What do you want to do?
          </h1>

          <p className="mt-4 max-w-xl text-lg leading-7 text-[var(--ink-soft)]">
            Choose any capabilities you want to use on GEB.
            You can select multiple.
          </p>

        </div>

        <div className="mt-10 space-y-4">

          {capabilities.map(
            ({
              role,
              title,
              description,
              icon: Icon,
            }) => {
              const selected =
                selectedRoles.includes(role);

              return (
                <button
                  key={role}
                  type="button"
                  onClick={() =>
                    toggleRole(role)
                  }
                  className={`flex w-full items-center gap-5 rounded-3xl border p-6 text-left transition ${
                    selected
                      ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                      : "border-[var(--stone-line)] bg-[var(--paper-raised)] hover:border-[var(--copper-400)]"
                  }`}
                >

                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                      selected
                        ? "bg-white/10"
                        : "bg-[var(--paper)]"
                    }`}
                  >
                    <Icon size={21} />
                  </div>

                  <div className="flex-1">

                    <h2 className="text-lg font-semibold">
                      {title}
                    </h2>

                    <p
                      className={`mt-1 text-sm ${
                        selected
                          ? "text-[var(--ink-soft)]"
                          : "text-[var(--ink-soft)]"
                      }`}
                    >
                      {description}
                    </p>

                  </div>

                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                      selected
                        ? "border-white bg-white text-[var(--ink)]"
                        : "border-[var(--stone-line)]"
                    }`}
                  >
                    {selected && (
                      <Check size={16} />
                    )}
                  </div>

                </button>
              );
            }
          )}

        </div>

        {message && (
          <div className="mt-5 rounded-2xl border border-[var(--stone-line)] bg-[var(--paper-raised)] px-5 py-4 text-sm font-medium">
            {message}
          </div>
        )}

        <button
          type="button"
          onClick={saveCapabilities}
          disabled={saving}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ink)] px-6 py-4 font-semibold text-white transition hover:bg-[var(--copper-700)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : "Save capabilities"}

          {!saving && (
            <ArrowRight size={18} />
          )}
        </button>

      </div>
    </main>
  );
}
