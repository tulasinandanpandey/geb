"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Compass,
  Sparkles,
  Plus,
  User,
  LogOut,
  ChevronDown,
  MessageSquare,
  Heart,
  Calendar,
  Briefcase,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

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
    <header className="sticky top-0 z-[999999] w-full bg-white border-b border-slate-200 transition-all shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo - Using Official GEB Prop Logo Image */}
        <Link href="/" className="flex items-center gap-3 group">
          <img
            src="/geb-logo.png"
            alt="GEB Prop Logo"
            className="h-11 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </Link>

        {/* Center Pill Capsule Navigation Bar */}
        <nav className="hidden md:flex items-center bg-slate-100/90 p-1.5 rounded-full border border-slate-200/90 shadow-inner text-xs font-semibold">
          <Link
            href="/"
            className={`px-4 py-2 rounded-full transition-all ${
              pathname === "/"
                ? "bg-white text-slate-900 shadow-sm font-extrabold"
                : "text-slate-600 hover:text-slate-900"
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
            className="px-4 py-2 rounded-full text-slate-600 hover:text-slate-900 transition-all cursor-pointer font-bold"
          >
            Marketplace
          </button>
          <Link
            href="/deep-land-analysis"
            className={`px-4 py-2 rounded-full transition-all flex items-center gap-1.5 ${
              isDeepLand
                ? "bg-sky-600 text-white font-extrabold shadow-md"
                : "text-slate-600 hover:text-sky-600"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Land Analysis GIS</span>
          </Link>
          {onOpenAIChat && (
            <button
              type="button"
              onClick={onOpenAIChat}
              className="px-4 py-2 rounded-full text-sky-700 hover:text-sky-900 hover:bg-sky-50 font-extrabold transition-all flex items-center gap-1 cursor-pointer"
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
            className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="w-3.5 h-3.5 text-sky-400" />
            <span>List Property</span>
          </Link>

          {/* Account Profile / Dropdown Toggle */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-all cursor-pointer shadow-sm"
              >
                <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center font-extrabold text-xs shadow-sm">
                  {user.email?.[0].toUpperCase() || "P"}
                </div>
                <span className="text-xs font-extrabold text-sky-900 hidden sm:inline truncate max-w-[120px]">
                  {user.email?.split("@")[0]}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-sky-700 transition-transform ${accountMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Account Dropdown Drawer Menu */}
              {accountMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white/95 backdrop-blur-2xl rounded-3xl border border-slate-200 p-4 shadow-2xl z-50 text-slate-800 space-y-3 animate-in fade-in duration-150">
                  {/* Account Header */}
                  <div className="border-b border-slate-100 pb-3 px-1">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Signed In As</p>
                    <p className="text-xs font-bold text-slate-900 truncate mt-0.5">{user.email}</p>
                  </div>

                  {/* Buyer Navigation Links */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1 mb-1">Buyer Hub</p>
                    <Link
                      href="/buyer-dashboard?tab=profile"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-sky-600" />
                      <span>My Profile</span>
                    </Link>
                    <Link
                      href="/buyer-dashboard?tab=conversations"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                      <span>Buyer Messages</span>
                    </Link>
                    <Link
                      href="/buyer-dashboard?tab=saved"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
                    >
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      <span>Saved Properties</span>
                    </Link>
                  </div>

                  {/* Seller Navigation Links */}
                  <div className="border-t border-slate-100 pt-2 space-y-1">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1 mb-1">Seller Hub</p>
                    <Link
                      href="/seller-dashboard?tab=overview"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-slate-700" />
                      <span>Seller CRM Dashboard</span>
                    </Link>
                    <Link
                      href="/seller-dashboard?tab=properties"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-slate-700" />
                      <span>My Listed Properties</span>
                    </Link>
                  </div>

                  {/* Sign Out Button */}
                  <div className="border-t border-slate-100 pt-2">
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
              className="px-5 py-2.5 rounded-full border border-slate-300 hover:border-slate-400 bg-white text-slate-800 text-xs font-bold transition-all shadow-sm"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
