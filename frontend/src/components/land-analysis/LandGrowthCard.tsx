"use client";

import {
  TrendingUp,
  Satellite,
  Compass,
  MapPin,
  Building,
  Zap,
  CheckCircle2,
  Navigation,
} from "lucide-react";
import { LandGrowthAnalysis } from "@/services/landAnalysis";

interface LandGrowthCardProps {
  growth: LandGrowthAnalysis;
  onOpenAiChat?: () => void;
}

export default function LandGrowthCard({
  growth,
  onOpenAiChat,
}: LandGrowthCardProps) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-md space-y-6 text-slate-800 font-sans">
      {/* Header Banner */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
              Satellite Earth Observation
            </span>
            <span className="text-xs text-slate-500 font-medium">
              ({growth.latitude.toFixed(4)}, {growth.longitude.toFixed(4)})
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 mt-2 tracking-tight">
            {growth.property_title || "Evaluated Growth Corridor"}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Growth Stage: <span className="text-purple-700 font-bold">{growth.growth_stage}</span>
          </p>
        </div>

        {onOpenAiChat && (
          <button
            onClick={onOpenAiChat}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer"
          >
            <Zap className="w-4 h-4 text-white" />
            <span>Ask Growth AI Co-Pilot</span>
          </button>
        )}
      </div>

      {/* Primary Appreciation Velocity Radial Metric */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center gap-5 shadow-sm">
        <div className="relative flex items-center justify-center">
          <svg className="w-20 h-20 transform -rotate-90">
            <circle cx="40" cy="40" r="32" stroke="#e2e8f0" strokeWidth="7" fill="transparent" />
            <circle
              cx="40"
              cy="40"
              r="32"
              stroke="#9333ea"
              strokeWidth="7"
              strokeDasharray={201}
              strokeDashoffset={201 - (201 * growth.appreciation_velocity_score) / 100}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <span className="absolute text-base font-extrabold text-purple-900">
            {growth.appreciation_velocity_score}
          </span>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-purple-700 text-xs font-extrabold uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span>Appreciation Velocity Rating</span>
          </div>
          <p className="text-base font-extrabold text-slate-900 mt-0.5">
            {growth.appreciation_velocity_score >= 88
              ? "High Growth Velocity Corridor"
              : "Moderate Steady Appreciation"}
          </p>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Zoning: <span className="text-slate-900 font-bold">{growth.land_use_zoning}</span>
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
          <p className="text-slate-400 text-[11px] font-bold">5-Yr Built-Up Density</p>
          <p className="text-base font-extrabold text-purple-700 mt-1">+{growth.builtup_expansion_5yr_pct}%</p>
          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Urban Expansion Rate</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
          <p className="text-slate-400 text-[11px] font-bold">NDVI Vegetation Index</p>
          <p className="text-base font-extrabold text-emerald-700 mt-1">{growth.ndvi_vegetation_index}</p>
          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Green Canopy Coverage</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
          <p className="text-slate-400 text-[11px] font-bold">Highway Connectivity</p>
          <p className="text-base font-extrabold text-sky-700 mt-1">{growth.highway_distance_km} km</p>
          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Arterial Road</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
          <p className="text-slate-400 text-[11px] font-bold">Metro/Rail Distance</p>
          <p className="text-base font-extrabold text-amber-700 mt-1">{growth.metro_distance_km} km</p>
          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Public Transit</p>
        </div>
      </div>

      {/* Satellite Telemetry Summary */}
      <div className="text-xs text-slate-600 italic bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
        "{growth.summary}"
      </div>
    </div>
  );
}
