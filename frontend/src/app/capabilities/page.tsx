"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Search, Store, Users, HardHat, Wrench, ShieldCheck, AlertCircle } from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";

type Role = "buyer" | "seller" | "broker" | "dealer" | "engineer";

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
  {
    role: "dealer",
    title: "Dealer services",
    description: "Verified land dealer, plot inventory, land acquisitions & deal execution.",
    icon: HardHat,
  },
  {
    role: "engineer",
    title: "Civil Engineer services",
    description: "Offer site inspection, structural engineering, CAD design & project construction supervision.",
    icon: Wrench,
  },
];

export default function CapabilitiesPage() {
  const { user, roles, loading, updateRoles } = useAuth();

  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!loading) {
      setSelectedRoles(roles);
    }
  }, [roles, loading]);

  function toggleRole(role: Role) {
    setSelectedRoles((current) => {
      if (current.includes(role)) {
        return current.filter((item) => item !== role);
      }
      return [...current, role];
    });
  }

  async function saveCapabilities() {
    if (!user) {
      return;
    }

    if (selectedRoles.length === 0) {
      setMessage("Please select at least one capability.");
      setSuccessMessage("");
      return;
    }

    setSaving(true);
    setMessage("");
    setSuccessMessage("");

    try {
      // 1. Delete existing roles in Supabase
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", user.id);

      if (deleteError) {
        console.warn("Notice deleting user_roles:", deleteError);
      }

      // 2. Insert selected roles
      const rows = selectedRoles.map((role) => ({
        user_id: user.id,
        role,
      }));

      const { error: insertError } = await supabase
        .from("user_roles")
        .insert(rows);

      if (insertError) {
        console.warn("Notice inserting user_roles:", insertError);
      }

      // Update state in AuthProvider
      if (updateRoles) {
        updateRoles(selectedRoles);
      }

      setSuccessMessage("Your GEB capabilities have been successfully updated!");
    } catch (error) {
      console.error("Unable to save capabilities:", error);
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
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Please sign in to select your GEB account capabilities.
          </p>

          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--copper-700)] transition-all"
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

        <div className="mt-10">

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--stone-line)] bg-[var(--paper-raised)] px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-sm">
            <ShieldCheck size={14} className="text-[var(--copper-600)]" />
            GEB Account Capabilities
          </div>

          <h1 className="font-display text-4xl font-medium tracking-tight md:text-5xl">
            What do you want to do?
          </h1>

          <p className="mt-3 max-w-xl text-base leading-relaxed text-[var(--ink-soft)]">
            Choose any capabilities you want to use on GEB. You can select multiple options including Dealer and Engineer roles.
          </p>

        </div>

        <div className="mt-8 space-y-4">

          {capabilities.map(
            ({
              role,
              title,
              description,
              icon: Icon,
            }) => {
              const selected = selectedRoles.includes(role);

              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className={`flex w-full items-center gap-5 rounded-3xl border p-6 text-left transition-all ${
                    selected
                      ? "border-[var(--ink)] bg-[var(--ink)] text-white shadow-lg scale-[1.01]"
                      : "border-[var(--stone-line)] bg-[var(--paper-raised)] hover:border-[var(--copper-400)] text-[var(--ink)]"
                  }`}
                >

                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-colors ${
                      selected
                        ? "bg-white/20 text-white"
                        : "bg-[var(--paper)] text-[var(--ink)]"
                    }`}
                  >
                    <Icon size={22} />
                  </div>

                  <div className="flex-1">

                    <h2 className="text-lg font-semibold">
                      {title}
                    </h2>

                    <p
                      className={`mt-1 text-sm ${
                        selected
                          ? "text-stone-200"
                          : "text-[var(--ink-soft)]"
                      }`}
                    >
                      {description}
                    </p>

                  </div>

                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all ${
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
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700 flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{message}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800 flex items-center gap-2">
            <Check size={18} className="text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        <button
          type="button"
          onClick={saveCapabilities}
          disabled={saving}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--copper-600)] hover:bg-[var(--copper-700)] px-6 py-4 font-bold text-white transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          {saving ? "Saving..." : "Save capabilities"}

          {!saving && (
            <ArrowRight size={18} />
          )}
        </button>

      </div>
    </main>
  );
}
