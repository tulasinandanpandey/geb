"use client";

import {
  Wind,
  ShieldCheck,
  Droplets,
  Zap,
  Activity,
  Trees,
  Factory,
  CheckCircle2,
} from "lucide-react";
import { AirIntelligenceAnalysis } from "@/services/landAnalysis";

interface AirIntelligenceCardProps {
  air: AirIntelligenceAnalysis;
  onOpenAiChat?: () => void;
}

export default function AirIntelligenceCard({
  air,
  onOpenAiChat,
}: AirIntelligenceCardProps) {
  const getAqiBadgeColor = (cat: string) => {
    switch (cat) {
      case "Good":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Satisfactory":
        return "bg-sky-100 text-sky-800 border-sky-200";
      case "Moderate":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Poor":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-rose-100 text-rose-800 border-rose-200";
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-md space-y-6 text-slate-800 font-sans">
      {/* Header Banner */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold border ${getAqiBadgeColor(
                air.aqi_category
              )}`}
            >
              AQI Category: {air.aqi_category}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              ({air.latitude.toFixed(4)}, {air.longitude.toFixed(4)})
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 mt-2 tracking-tight">
            {air.property_title || "Evaluated Air Quality Zone"}
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">{air.health_impact}</p>
        </div>

        {onOpenAiChat && (
          <button
            onClick={onOpenAiChat}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer"
          >
            <Zap className="w-4 h-4 text-white" />
            <span>Ask Air AI Co-Pilot</span>
          </button>
        )}
      </div>

      {/* Primary AQI & Environmental Health Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
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
                strokeDashoffset={163 - (163 * Math.min(300, air.aqi)) / 300}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <span className="absolute text-sm font-extrabold text-sky-900">{air.aqi}</span>
          </div>
          <div>
            <div className="flex items-center gap-1 text-slate-500 text-xs font-bold">
              <Wind className="w-3.5 h-3.5 text-sky-600" />
              <span>Air Quality Index (AQI)</span>
            </div>
            <p className="text-sm font-extrabold text-slate-900 mt-0.5">{air.aqi_category} Range</p>
            <p className="text-[11px] text-slate-500 font-medium">PM2.5: {air.pm25_ug_m3} µg/m³</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
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
                strokeDashoffset={163 - (163 * air.environmental_health_score) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <span className="absolute text-sm font-extrabold text-slate-900">
              {air.environmental_health_score}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1 text-slate-500 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Environmental Health Score</span>
            </div>
            <p className="text-sm font-extrabold text-slate-900 mt-0.5">
              {air.environmental_health_score >= 80 ? "Healthy Living Zone" : "Moderate Protection"}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">Green Buffer: {air.green_belt_buffer_km} km</p>
          </div>
        </div>
      </div>

      {/* Pollutants Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
          <p className="text-slate-400 text-[11px] font-bold">PM 2.5 Fine Particles</p>
          <p className="text-base font-extrabold text-sky-700 mt-1">{air.pm25_ug_m3} µg/m³</p>
          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Standard &lt;60</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
          <p className="text-slate-400 text-[11px] font-bold">PM 10 Coarse Particulate</p>
          <p className="text-base font-extrabold text-indigo-700 mt-1">{air.pm10_ug_m3} µg/m³</p>
          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Standard &lt;100</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
          <p className="text-slate-400 text-[11px] font-bold">Monsoon Season AQI</p>
          <p className="text-base font-extrabold text-emerald-700 mt-1">{air.seasonal_monsoon_aqi}</p>
          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Cleanest Season</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
          <p className="text-slate-400 text-[11px] font-bold">Winter Peak AQI</p>
          <p className="text-base font-extrabold text-amber-700 mt-1">{air.seasonal_winter_aqi}</p>
          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Inversion Season</p>
        </div>
      </div>

      {/* Telemetry Summary */}
      <div className="text-xs text-slate-600 italic bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
        "{air.summary}"
      </div>
    </div>
  );
}
