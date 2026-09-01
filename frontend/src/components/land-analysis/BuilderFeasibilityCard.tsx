"use client";

import {
  Building2,
  Ruler,
  Layers,
  Zap,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Compass,
} from "lucide-react";
import { BuilderFeasibilityAnalysis } from "@/services/landAnalysis";

interface BuilderFeasibilityCardProps {
  builder: BuilderFeasibilityAnalysis;
  onOpenAiChat?: () => void;
}

export default function BuilderFeasibilityCard({
  builder,
  onOpenAiChat,
}: BuilderFeasibilityCardProps) {
  return (
    <div className="bg-white border border-[var(--stone-line)]/90 rounded-3xl p-5 shadow-md space-y-6 text-[var(--ink)] font-sans">
      {/* Header Banner */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--stone-line)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">
              Builder Architectural Feasibility
            </span>
            <span className="text-xs text-[var(--ink-soft)] font-medium">
              Plot Area: {builder.plot_area_sqft} sqft
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-[var(--ink)] mt-2 tracking-tight">
            {builder.property_title || "Development Feasibility Report"}
          </h3>
          <p className="text-xs text-[var(--ink-soft)] mt-0.5 font-medium">
            Proposed Usage: <span className="text-indigo-700 font-bold">{builder.proposed_usage}</span>
          </p>
        </div>

        {onOpenAiChat && (
          <button
            onClick={onOpenAiChat}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer"
          >
            <Zap className="w-4 h-4 text-white" />
            <span>Consult Builder AI Advisor</span>
          </button>
        )}
      </div>

      {/* Primary Built-up Potential Banner */}
      <div className="bg-[var(--paper)] border border-[var(--stone-line)] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <span className="text-[10px] text-[var(--ink-soft)] font-extrabold uppercase tracking-wider">
            Potential Built-Up Area (FAR Multiplier {builder.estimated_far_multiplier}x)
          </span>
          <p className="text-2xl font-extrabold text-indigo-700 mt-1">
            {builder.potential_builtup_sqft} <span className="text-sm text-[var(--ink-soft)] font-medium">sqft</span>
          </p>
          <p className="text-xs text-[var(--ink-soft)] mt-0.5 font-medium">Estimated Height: {builder.estimated_max_floors}</p>
        </div>

        <div className="bg-white border border-[var(--stone-line)] px-4 py-3 rounded-xl text-xs shadow-sm">
          <span className="text-[var(--ink-soft)] font-medium">Max Ground Coverage:</span>
          <p className="text-base font-extrabold text-[var(--ink)] mt-0.5">
            {builder.max_ground_coverage_sqft} sqft ({builder.estimated_coverage_pct}%)
          </p>
        </div>
      </div>

      {/* Engineering Technical Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-[var(--paper)] border border-[var(--stone-line)] rounded-2xl p-3.5">
          <p className="text-[var(--ink-soft)] text-[11px] font-bold">Road Access Width</p>
          <p className="text-base font-extrabold text-[var(--ink)] mt-1">{builder.road_width_m} meters</p>
          <p className="text-[10px] text-[var(--ink-soft)] mt-0.5 font-medium">Determines Max Height</p>
        </div>

        <div className="bg-[var(--paper)] border border-[var(--stone-line)] rounded-2xl p-3.5">
          <p className="text-[var(--ink-soft)] text-[11px] font-bold">Recommended Foundation</p>
          <p className="text-xs font-extrabold text-emerald-700 mt-1">{builder.recommended_foundation}</p>
          <p className="text-[10px] text-[var(--ink-soft)] mt-0.5 font-medium">Bearing: {builder.bearing_capacity_kpa} kN/m²</p>
        </div>

        <div className="bg-[var(--paper)] border border-[var(--stone-line)] rounded-2xl p-3.5 col-span-2 sm:col-span-1">
          <p className="text-[var(--ink-soft)] text-[11px] font-bold">Basement Feasibility</p>
          <p className="text-xs font-extrabold text-indigo-700 mt-1">{builder.basement_feasibility}</p>
        </div>
      </div>

      {/* Prominent Regulatory Disclaimer Box */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 space-y-1.5 text-xs text-amber-900">
        <div className="flex items-center gap-1.5 font-extrabold text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Strict Municipal Regulatory Disclaimer</span>
        </div>
        <p className="text-[11px] leading-relaxed font-medium">{builder.regulatory_disclaimer}</p>
      </div>

      {/* Summary */}
      <div className="text-xs text-[var(--ink-soft)] italic bg-[var(--paper)] p-3.5 rounded-2xl border border-[var(--stone-line)]/80">
        "{builder.summary}"
      </div>
    </div>
  );
}
