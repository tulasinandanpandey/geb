"use client";

import {
  ShieldCheck,
  Building2,
  Sprout,
  Droplets,
  Zap,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Gauge,
  Compass,
} from "lucide-react";
import { SoilAnalysis } from "@/services/landAnalysis";

interface SoilAnalysisCardProps {
  analysis: SoilAnalysis;
  onOpenAiChat?: () => void;
}

export default function SoilAnalysisCard({
  analysis,
  onOpenAiChat,
}: SoilAnalysisCardProps) {
  return (
    <div className="bg-white border border-[var(--stone-line)]/90 rounded-3xl p-5 shadow-md space-y-6 text-[var(--ink)] font-sans">
      {/* Header Banner */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--stone-line)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {analysis.zone_name}
            </span>
            <span className="text-xs text-[var(--ink-soft)] font-medium">
              ({analysis.latitude.toFixed(4)}, {analysis.longitude.toFixed(4)})
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-[var(--ink)] mt-2 tracking-tight">
            {analysis.property_title || "Evaluated Land Parcel"}
          </h3>
          <p className="text-xs text-[var(--ink-soft)] mt-0.5 font-medium">
            Soil Classification: <span className="text-emerald-700 font-bold">{analysis.soil_type}</span>
          </p>
        </div>

        {onOpenAiChat && (
          <button
            onClick={onOpenAiChat}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer"
          >
            <Zap className="w-4 h-4 text-white" />
            <span>Ask Soil AI Co-Pilot</span>
          </button>
        )}
      </div>

      {/* Primary Score Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[var(--paper)] border border-[var(--stone-line)] rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="relative flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle cx="32" cy="32" r="26" stroke="#e2e8f0" strokeWidth="6" fill="transparent" />
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="#10b981"
                strokeWidth="6"
                strokeDasharray={163}
                strokeDashoffset={163 - (163 * analysis.construction_suitability_score) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <span className="absolute text-sm font-extrabold text-[var(--ink)]">
              {analysis.construction_suitability_score}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1 text-[var(--ink-soft)] text-xs font-bold">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Construction Feasibility</span>
            </div>
            <p className="text-sm font-extrabold text-[var(--ink)] mt-0.5">
              {analysis.construction_suitability_score >= 80
                ? "Highly Suitable"
                : analysis.construction_suitability_score >= 65
                ? "Moderate Suitability"
                : "Requires Deep Piling"}
            </p>
            <p className="text-[11px] text-[var(--ink-soft)] font-medium">Safe load: {analysis.bearing_capacity_kpa} kN/m²</p>
          </div>
        </div>

        <div className="bg-[var(--paper)] border border-[var(--stone-line)] rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="relative flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle cx="32" cy="32" r="26" stroke="#e2e8f0" strokeWidth="6" fill="transparent" />
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="#0284c7"
                strokeWidth="6"
                strokeDasharray={163}
                strokeDashoffset={163 - (163 * analysis.agricultural_suitability_score) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <span className="absolute text-sm font-extrabold text-[var(--ink)]">
              {analysis.agricultural_suitability_score}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1 text-[var(--ink-soft)] text-xs font-bold">
              <Sprout className="w-3.5 h-3.5 text-orange-600" />
              <span>Agronomic Rating</span>
            </div>
            <p className="text-sm font-extrabold text-[var(--ink)] mt-0.5">
              {analysis.agricultural_suitability_score >= 85 ? "Prime Arable Soil" : "Moderate Crop Yield"}
            </p>
            <p className="text-[11px] text-[var(--ink-soft)] font-medium">Soil pH: {analysis.soil_ph} (Neutral)</p>
          </div>
        </div>
      </div>

      {/* Detailed Technical Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-[var(--paper)] border border-[var(--stone-line)] rounded-2xl p-3.5">
          <p className="text-[var(--ink-soft)] text-[11px] font-bold">Safe Bearing Capacity</p>
          <p className="text-base font-extrabold text-emerald-700 mt-1">{analysis.bearing_capacity_kpa} kN/m²</p>
          <p className="text-[10px] text-[var(--ink-soft)] mt-0.5 font-medium">Allows 2-5 Stories</p>
        </div>

        <div className="bg-[var(--paper)] border border-[var(--stone-line)] rounded-2xl p-3.5">
          <p className="text-[var(--ink-soft)] text-[11px] font-bold">Water Table Depth</p>
          <p className="text-base font-extrabold text-orange-700 mt-1">{analysis.water_table_depth_m} meters</p>
          <p className="text-[10px] text-[var(--ink-soft)] mt-0.5 font-medium">Below Ground Level</p>
        </div>

        <div className="bg-[var(--paper)] border border-[var(--stone-line)] rounded-2xl p-3.5">
          <p className="text-[var(--ink-soft)] text-[11px] font-bold">Soil pH Level</p>
          <p className="text-base font-extrabold text-amber-700 mt-1">{analysis.soil_ph}</p>
          <p className="text-[10px] text-[var(--ink-soft)] mt-0.5 font-medium">Optimal Availability</p>
        </div>

        <div className="bg-[var(--paper)] border border-[var(--stone-line)] rounded-2xl p-3.5">
          <p className="text-[var(--ink-soft)] text-[11px] font-bold">Flood Risk Level</p>
          <p
            className={`text-base font-extrabold mt-1 ${
              analysis.flood_risk === "Low"
                ? "text-emerald-700"
                : analysis.flood_risk === "Medium"
                ? "text-amber-700"
                : "text-rose-700"
            }`}
          >
            {analysis.flood_risk}
          </p>
          <p className="text-[10px] text-[var(--ink-soft)] mt-0.5 font-medium">Slope: {analysis.slope_percent}%</p>
        </div>
      </div>

      {/* Structural Foundation & Crop Recommendations */}
      <div className="space-y-3 bg-[var(--paper)] border border-[var(--stone-line)] rounded-2xl p-4 text-xs">
        <div>
          <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>Recommended Foundation Engineering</span>
          </div>
          <p className="text-[var(--ink)] font-bold mt-1">{analysis.recommended_foundation}</p>
        </div>

        <div className="pt-2 border-t border-[var(--stone-line)]">
          <div className="flex items-center gap-1.5 text-orange-800 font-extrabold">
            <Sprout className="w-4 h-4 text-orange-600" />
            <span>High-Yield Crop Rotation</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {analysis.suitable_crops.map((crop, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200 font-extrabold text-[10px]"
              >
                {crop}
              </span>
            ))}
          </div>
        </div>

        {analysis.soil_remediation_notes && (
          <div className="pt-2 border-t border-[var(--stone-line)] text-[var(--ink-soft)]">
            <div className="flex items-center gap-1.5 text-amber-800 font-extrabold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Geotechnical Remediation Advice</span>
            </div>
            <p className="text-[var(--ink-soft)] text-[11px] mt-1 font-medium">{analysis.soil_remediation_notes}</p>
          </div>
        )}
      </div>

      {/* Technical Summary */}
      <div className="text-xs text-[var(--ink-soft)] italic bg-[var(--paper)] p-3.5 rounded-2xl border border-[var(--stone-line)]/80">
        "{analysis.summary}"
      </div>
    </div>
  );
}
