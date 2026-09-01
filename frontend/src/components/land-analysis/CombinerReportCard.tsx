"use client";

import {
  Sparkles,
  ShieldAlert,
  Zap,
  TrendingUp,
  Wind,
  Sprout,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import { CombinerAnalysis } from "@/services/landAnalysis";

interface CombinerReportCardProps {
  combiner: CombinerAnalysis;
  onOpenAiChat?: () => void;
}

export default function CombinerReportCard({
  combiner,
  onOpenAiChat,
}: CombinerReportCardProps) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-md space-y-6 text-slate-800 font-sans">
      {/* Header Banner */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-sky-100 text-sky-800 border border-sky-200">
              GEB Unified Land Suitability Engine
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Confidence: {combiner.data_confidence_rating}
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 mt-2 tracking-tight">
            {combiner.property_title || "Deep Land Synthesis Report"}
          </h3>
        </div>

        {onOpenAiChat && (
          <button
            onClick={onOpenAiChat}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer"
          >
            <Zap className="w-4 h-4 text-white" />
            <span>Consult Deep Land Advisor</span>
          </button>
        )}
      </div>

      {/* Primary Unified Score Gauge */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle cx="40" cy="40" r="32" stroke="#e2e8f0" strokeWidth="7" fill="transparent" />
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="#0284c7"
                strokeWidth="7"
                strokeDasharray={201}
                strokeDashoffset={201 - (201 * combiner.overall_suitability_score) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <span className="absolute text-lg font-extrabold text-sky-900">
              {combiner.overall_suitability_score}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-sky-700 text-xs font-extrabold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>GEB Unified Land Suitability Index</span>
            </div>
            <p className="text-base font-extrabold text-slate-900 mt-0.5">
              {combiner.overall_suitability_score >= 85
                ? "Prime High-Suitability Land"
                : "Moderate Suitability with Specific Trade-offs"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-xs w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-6">
          <div className="text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Investment Fit</span>
            <p className="text-base font-extrabold text-purple-700 mt-0.5">{combiner.investment_suitability_score}/100</p>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Living Quality</span>
            <p className="text-base font-extrabold text-sky-700 mt-0.5">{combiner.residential_living_score}/100</p>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Agri Yield</span>
            <p className="text-base font-extrabold text-emerald-700 mt-0.5">{combiner.agricultural_yield_score}/100</p>
          </div>
        </div>
      </div>

      {/* Key Trade-offs */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 space-y-2 text-xs">
        <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Evaluated Trade-Off Analysis</span>
        </h4>
        <ul className="space-y-1 text-amber-900/90 font-medium">
          {combiner.key_tradeoffs.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Uncertainty Disclosures */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
        <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-slate-500" />
          <span>Transparent Uncertainty & Regulatory Disclosures</span>
        </h4>
        <ul className="space-y-1 text-slate-600 text-[11px] font-medium">
          {combiner.uncertainty_disclosures.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-slate-400">⚠</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Summary */}
      <div className="text-xs text-sky-900 font-medium italic bg-sky-50/70 p-3.5 rounded-2xl border border-sky-100">
        "{combiner.summary}"
      </div>
    </div>
  );
}
