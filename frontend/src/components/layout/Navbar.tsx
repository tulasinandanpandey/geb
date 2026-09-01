"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Sparkles,
  Plus,
  User,
  LogOut,
  ChevronDown,
  MessageSquare,
  Heart,
  Briefcase,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import GEBLogo from "@/components/common/GEBLogo";

interface NavbarProps {
  onOpenAIChat?: () => void;
}

export default function Navbar({ onOpenAIChat }: NavbarProps) {
  const { user, roles, signOut } = useAuth();
  const pathname = usePathname();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDeepLand = pathname === "/deep-land-analysis";

  // Close account menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-[999999] w-full bg-[var(--paper-raised)]/95 backdrop-blur-md border-b border-[var(--stone-line)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo - Vector GEB Logo */}
        <GEBLogo size="md" />

        {/* Center Pill Capsule Navigation Bar */}
        <nav className="hidden md:flex items-center bg-[var(--paper)] p-1.5 rounded-full border border-[var(--stone-line)] text-xs font-semibold">
          <Link
            href="/"
            className={`px-4 py-2 rounded-full transition-all ${
              pathname === "/"
                ? "bg-[var(--ink)] text-white font-bold"
                : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
            }`}
          >
            Home
          </Link>
          <button
            type="button"
            onClick={() => {
              if (pathname === "/") {
                document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" });
              } else {
                window.location.href = "/#explore";
              }
            }}
            className="px-4 py-2 rounded-full text-[var(--ink-soft)] hover:text-[var(--ink)] transition-all cursor-pointer font-semibold"
          >
            Marketplace
          </button>
          <Link
            href="/deep-land-analysis"
            className={`px-4 py-2 rounded-full transition-all flex items-center gap-1.5 ${
              isDeepLand
                ? "bg-[var(--copper-600)] text-white font-bold"
                : "text-[var(--ink-soft)] hover:text-[var(--copper-700)]"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Land Analysis GIS</span>
          </Link>
          {onOpenAIChat && (
            <button
              type="button"
              onClick={onOpenAIChat}
              className="px-4 py-2 rounded-full text-[var(--violet)] hover:bg-[var(--violet-soft)] font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask GEB AI</span>
            </button>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/list-property"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[var(--ink)] hover:bg-[var(--copper-700)] text-white text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-[var(--copper-400)]" />
            <span>List Property</span>
          </Link>

          {/* Account Profile / Dropdown Toggle */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--copper-50)] hover:bg-[var(--copper-100)] border border-[var(--copper-100)] transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--copper-600)] text-white flex items-center justify-center font-bold text-xs">
                  {user.email?.[0].toUpperCase() || "P"}
                </div>
                <span className="text-xs font-bold text-[var(--copper-900)] hidden sm:inline truncate max-w-[120px]">
                  {user.email?.split("@")[0]}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-[var(--copper-700)] transition-transform ${accountMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Account Dropdown Drawer Menu */}
              {accountMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-[var(--paper-raised)]/98 backdrop-blur-2xl rounded-3xl border border-[var(--stone-line)] p-4 shadow-2xl z-50 text-[var(--ink)] space-y-3">
                  {/* Account Header */}
                  <div className="border-b border-[var(--stone-line)] pb-3 px-1">
                    <p className="text-[10px] font-bold text-[var(--ink-soft)] uppercase tracking-wider">Signed In As</p>
                    <p className="text-xs font-bold text-[var(--ink)] truncate mt-0.5">{user.email}</p>
                  </div>

                  {/* Buyer Navigation Links */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-[var(--ink-soft)] uppercase tracking-wider px-1 mb-1">Buyer Hub</p>
                    <Link
                      href="/buyer-dashboard?tab=profile"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--ink-soft)] hover:bg-[var(--copper-50)] hover:text-[var(--copper-700)] transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-[var(--copper-600)]" />
                      <span>My Profile</span>
                    </Link>
                    <Link
                      href="/buyer-dashboard?tab=conversations"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--ink-soft)] hover:bg-[var(--copper-50)] hover:text-[var(--copper-700)] transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[var(--copper-600)]" />
                      <span>Buyer Messages</span>
                    </Link>
                    <Link
                      href="/buyer-dashboard?tab=saved"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--ink-soft)] hover:bg-[var(--copper-50)] hover:text-[var(--copper-700)] transition-colors"
                    >
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      <span>Saved Properties</span>
                    </Link>
                  </div>

                  {/* Seller Navigation Links */}
                  <div className="border-t border-[var(--stone-line)] pt-2 space-y-1">
                    <p className="text-[10px] font-bold text-[var(--ink-soft)] uppercase tracking-wider px-1 mb-1">Seller Hub</p>
                    <Link
                      href="/seller-dashboard?tab=overview"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--ink-soft)] hover:bg-[var(--paper)] hover:text-[var(--ink)] transition-colors"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span>Seller CRM Dashboard</span>
                    </Link>
                    <Link
                      href="/seller-dashboard?tab=properties"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--ink-soft)] hover:bg-[var(--paper)] hover:text-[var(--ink)] transition-colors"
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>My Listed Properties</span>
                    </Link>
                  </div>

                  {/* Sign Out Button */}
                  <div className="border-t border-[var(--stone-line)] pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        signOut();
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-full border border-[var(--stone-line)] hover:border-[var(--copper-400)] bg-[var(--paper-raised)] text-[var(--ink)] text-xs font-bold transition-all"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
