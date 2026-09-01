"use client";

import React from "react";
import Link from "next/link";

interface GEBLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "light" | "dark" | "auto";
  showTagline?: boolean;
  className?: string;
  href?: string;
}

export default function GEBLogo({
  size = "md",
  variant = "auto",
  showTagline = true,
  className = "",
  href = "/",
}: GEBLogoProps) {
  // Dimensions mapping
  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-14 h-14",
  };

  const titleSizes = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  const taglineSizes = {
    sm: "text-[8px]",
    md: "text-[9px]",
    lg: "text-[10px]",
    xl: "text-[11px]",
  };

  const textColorClass =
    variant === "dark"
      ? "text-white"
      : variant === "light"
      ? "text-gray-900"
      : "text-[var(--ink)]";

  const taglineColorClass =
    variant === "dark"
      ? "text-orange-300/80"
      : "text-[var(--ink-soft)]";

  const LogoContent = (
    <div className={`inline-flex items-center gap-3 group select-none ${className}`}>
      {/* Icon Mark: Stylized Architectural Bridge & Property Emblem */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-orange-600 via-amber-600 to-orange-700 text-white shadow-lg shadow-orange-600/25 ring-1 ring-white/30 transition-transform duration-300 group-hover:scale-105 shrink-0 overflow-hidden`}
      >
        {/* Subtle background ambient shine */}
        <div className="absolute top-0 right-0 w-8 h-8 bg-white/20 rounded-full blur-md" />

        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/5 h-3/5 text-white transform transition-transform group-hover:rotate-3"
        >
          {/* Bridge & Property Geometric Paths */}
          <path
            d="M4 22C8 17 13 14 16 14C19 14 24 17 28 22"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M16 4L6 13V24C6 25.1046 6.89543 26 8 26H24C25.1046 26 26 25.1046 26 24V13L16 4Z"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M12 26V18C12 16.8954 12.8954 16 14 16H18C19.1046 16 20 16.8954 20 18V26"
            fill="currentColor"
            fillOpacity="0.3"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <circle cx="16" cy="10.5" r="2" fill="#fef08a" />
        </svg>
      </div>

      {/* Typography */}
      <div className="flex flex-col">
        <div className={`font-black tracking-tight leading-none ${titleSizes[size]} ${textColorClass} flex items-center gap-1.5`}>
          <span>GEB</span>
          <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent font-black tracking-wide">
            PROP
          </span>
        </div>

        {showTagline && (
          <span
            className={`font-bold ${taglineSizes[size]} uppercase tracking-[0.18em] leading-none mt-1 ${taglineColorClass}`}
          >
            Global Estate Bridge
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {LogoContent}
      </Link>
    );
  }

  return LogoContent;
}
