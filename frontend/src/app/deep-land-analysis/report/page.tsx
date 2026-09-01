"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Compass, Loader2, Sparkles } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import LandAnalysisFullReport from "@/components/land-analysis/LandAnalysisFullReport";
import {
  SoilAnalysis,
  LandGrowthAnalysis,
  AirIntelligenceAnalysis,
  CombinerAnalysis,
  BuilderFeasibilityAnalysis,
  analyzeComprehensiveLand,
} from "@/services/landAnalysis";

function LandReportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const propertyId = searchParams.get("property_id") || undefined;
  const latStr = searchParams.get("lat");
  const lngStr = searchParams.get("lng");
  const titleParam = searchParams.get("title") || undefined;

  const lat = latStr ? parseFloat(latStr) : 26.8467;
  const lng = lngStr ? parseFloat(lngStr) : 80.9462;

  const [loading, setLoading] = useState(true);
  const [soilAnalysis, setSoilAnalysis] = useState<SoilAnalysis | null>(null);
  const [growthAnalysis, setGrowthAnalysis] = useState<LandGrowthAnalysis | null>(null);
  const [airAnalysis, setAirAnalysis] = useState<AirIntelligenceAnalysis | null>(null);
  const [combinerAnalysis, setCombinerAnalysis] = useState<CombinerAnalysis | null>(null);
  const [builderAnalysis, setBuilderAnalysis] = useState<BuilderFeasibilityAnalysis | null>(null);

  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      try {
        const res = await analyzeComprehensiveLand({
          property_id: propertyId,
          latitude: lat,
          longitude: lng,
        });
        setSoilAnalysis(res.soil_analysis);
        setGrowthAnalysis(res.growth_analysis);
        setAirAnalysis(res.air_analysis);
        setCombinerAnalysis(res.combiner_analysis);
        setBuilderAnalysis(res.builder_analysis);
      } catch (err) {
        console.error("Failed to load full report:", err);
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [propertyId, lat, lng]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#dbeafe]/40 via-[var(--paper)] to-[#f8fafc] text-[var(--ink)] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation back bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/deep-land-analysis"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-[var(--stone-line)] text-xs font-extrabold text-[var(--ink)] hover:bg-[var(--paper)] transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-orange-600" />
            <span>Back to Interactive GIS Map</span>
          </Link>

          <div className="text-xs text-[var(--ink-soft)] font-medium">
            <span>Coordinates: {lat.toFixed(4)}, {lng.toFixed(4)}</span>
          </div>
        </div>

        {loading ? (
          <div className="w-full h-[400px] bg-white rounded-3xl border border-[var(--stone-line)] flex flex-col items-center justify-center text-[var(--ink-soft)] gap-3 shadow-xl">
            <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
            <span className="text-sm font-extrabold text-[var(--ink)]">Synthesizing 5-Agent GIS Intelligence Report...</span>
            <span className="text-xs text-[var(--ink-soft)]">Evaluating Soil, FAR, Growth & Environmental AQI...</span>
          </div>
        ) : (
          <LandAnalysisFullReport
            soilAnalysis={soilAnalysis}
            growthAnalysis={growthAnalysis}
            airAnalysis={airAnalysis}
            combinerAnalysis={combinerAnalysis}
            builderAnalysis={builderAnalysis}
            title={titleParam || soilAnalysis?.property_title || combinerAnalysis?.property_title}
            locationLabel={`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`}
          />
        )}
      </main>
    </div>
  );
}

export default function DedicatedLandReportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
        </div>
      }
    >
      <LandReportContent />
    </Suspense>
  );
}
