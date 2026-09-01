"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Compass,
  MapPin,
  Bot,
  Loader2,
  Sparkles,
  TrendingUp,
  Sprout,
  Building2,
  ShieldCheck,
} from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import { Property } from "@/types/property";
import { getProperties } from "@/services/properties";
import {
  SoilZone,
  SoilAnalysis,
  LandGrowthAnalysis,
  AirIntelligenceAnalysis,
  CombinerAnalysis,
  BuilderFeasibilityAnalysis,
  getSoilZones,
  analyzeComprehensiveLand,
} from "@/services/landAnalysis";
import SoilAgentDrawer from "@/components/land-analysis/SoilAgentDrawer";

const DeepLandAnalysisMap = dynamic(
  () => import("@/components/map/DeepLandAnalysisMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[550px] bg-slate-100/80 rounded-3xl border border-slate-200 flex flex-col items-center justify-center text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        <span className="text-xs font-semibold">Loading GEB 5-Agent GIS Suite...</span>
      </div>
    ),
  }
);

export default function DeepLandAnalysisPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [soilZones, setSoilZones] = useState<SoilZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [sampledLocation, setSampledLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [soilAnalysis, setSoilAnalysis] = useState<SoilAnalysis | null>(null);
  const [growthAnalysis, setGrowthAnalysis] = useState<LandGrowthAnalysis | null>(null);
  const [airAnalysis, setAirAnalysis] = useState<AirIntelligenceAnalysis | null>(null);
  const [combinerAnalysis, setCombinerAnalysis] = useState<CombinerAnalysis | null>(null);
  const [builderAnalysis, setBuilderAnalysis] = useState<BuilderFeasibilityAnalysis | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [propsData, zonesData] = await Promise.all([
          getProperties().catch(() => []),
          getSoilZones().catch(() => []),
        ]);
        setProperties(propsData);
        setSoilZones(zonesData);

        if (propsData.length > 0) {
          handleSelectProperty(propsData[0]);
        } else {
          handleSampleLocation(26.8467, 80.9462);
        }
      } catch (err) {
        console.error("Failed loading multi-agent page data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  const handleSelectProperty = async (property: Property) => {
    setSelectedProperty(property);
    setSampledLocation({ lat: property.latitude, lng: property.longitude });
    setAnalyzing(true);

    try {
      const res = await analyzeComprehensiveLand({
        property_id: property.id,
        latitude: property.latitude,
        longitude: property.longitude,
      });
      setSoilAnalysis(res.soil_analysis);
      setGrowthAnalysis(res.growth_analysis);
      setAirAnalysis(res.air_analysis);
      setCombinerAnalysis(res.combiner_analysis);
      setBuilderAnalysis(res.builder_analysis);
      // Drawer is opened on demand via "Ask GEB for Report" icon
    } catch (err) {
      console.error("Comprehensive land analysis error:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSampleLocation = async (lat: number, lng: number) => {
    setSelectedProperty(null);
    setSampledLocation({ lat, lng });
    setAnalyzing(true);

    try {
      const res = await analyzeComprehensiveLand({
        latitude: lat,
        longitude: lng,
      });
      setSoilAnalysis(res.soil_analysis);
      setGrowthAnalysis(res.growth_analysis);
      setAirAnalysis(res.air_analysis);
      setCombinerAnalysis(res.combiner_analysis);
      setBuilderAnalysis(res.builder_analysis);
      // Drawer is opened on demand via "Ask GEB for Report" icon
    } catch (err) {
      console.error("Coordinate land analysis error:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#dbeafe]/40 via-slate-50 to-[#f8fafc] text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Hero Banner - Matching Inspiration Light Glass Aesthetic */}
        <div className="relative rounded-3xl bg-white/90 backdrop-blur-xl border border-white p-6 sm:p-8 overflow-hidden shadow-xl shadow-sky-900/5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-extrabold bg-sky-100 text-sky-700 border border-sky-200">
                <Compass className="w-3.5 h-3.5" />
                <span>GEB 5-Agent GIS Intelligence</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans">
                Deep Land & Architectural Feasibility Suite
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Synthesize Soil Bearing Capacity, Satellite Growth Corridors, Environmental AQI, Overall Land Suitability, and Builder Development FAR metrics.
              </p>
            </div>

            {combinerAnalysis && (
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-extrabold text-xs transition-all shadow-xl shadow-sky-600/30 cursor-pointer border border-white/40"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Ask GEB for Full Report</span>
              </button>
            )}
          </div>
        </div>

        {/* Intelligence Summary Bar */}
        {combinerAnalysis && builderAnalysis && soilAnalysis && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
            <div className="bg-white/80 backdrop-blur-md border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[11px]">GEB Land Suitability</span>
                <p className="text-lg font-extrabold text-sky-700 mt-0.5">
                  {combinerAnalysis.overall_suitability_score}/100 Index
                </p>
                <p className="text-[10px] text-slate-500">Investment: {combinerAnalysis.investment_suitability_score}/100</p>
              </div>
              <Sparkles className="w-6 h-6 text-sky-600" />
            </div>

            <div className="bg-white/80 backdrop-blur-md border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[11px]">Builder FAR Potential</span>
                <p className="text-lg font-extrabold text-indigo-600 mt-0.5">
                  {builderAnalysis.potential_builtup_sqft} sqft
                </p>
                <p className="text-[10px] text-slate-500">Estimated {builderAnalysis.estimated_max_floors}</p>
              </div>
              <Building2 className="w-6 h-6 text-indigo-600" />
            </div>

            <div className="bg-white/80 backdrop-blur-md border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[11px]">Construction Feasibility</span>
                <p className="text-lg font-extrabold text-emerald-600 mt-0.5">
                  {soilAnalysis.construction_suitability_score}/100 Rating
                </p>
                <p className="text-[10px] text-slate-500">Bearing: {soilAnalysis.bearing_capacity_kpa} kN/m²</p>
              </div>
              <Sprout className="w-6 h-6 text-emerald-600" />
            </div>

            <div className="bg-white/80 backdrop-blur-md border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[11px]">Growth & AQI Index</span>
                <p className="text-lg font-extrabold text-cyan-600 mt-0.5">
                  {growthAnalysis?.appreciation_velocity_score ?? 90}/100 Rating
                </p>
                <p className="text-[10px] text-slate-500">AQI: {airAnalysis?.aqi ?? 75} ({airAnalysis?.aqi_category})</p>
              </div>
              <TrendingUp className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
        )}

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* GIS Map Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="h-[600px] w-full relative rounded-3xl overflow-hidden border border-slate-200 shadow-xl">
              {analyzing && (
                <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-sm rounded-3xl flex items-center justify-center text-sky-700 font-bold text-xs gap-3">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Synthesizing Geotechnical, Growth & FAR Feasibility...</span>
                </div>
              )}

              <DeepLandAnalysisMap
                properties={properties}
                soilZones={soilZones}
                selectedProperty={selectedProperty}
                sampledLocation={sampledLocation}
                activeSoil={soilAnalysis}
                activeGrowth={growthAnalysis}
                activeAir={airAnalysis}
                onSelectProperty={handleSelectProperty}
                onSampleLocation={handleSampleLocation}
              />
            </div>
          </div>

          {/* Active Listings Column */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-600" />
                  <span>Active Land Listings</span>
                </h2>
                <span className="text-xs text-slate-400 font-semibold">{properties.length} Plots</span>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {properties.map((property) => {
                  const isSelected = selectedProperty?.id === property.id;
                  const isRent = property.listingType === "rent" || property.title.toLowerCase().includes("rent");
                  const priceVal = property.monthlyRent || property.price;

                  return (
                    <div
                      key={property.id}
                      onClick={() => handleSelectProperty(property)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-sky-50 border-sky-500/80 shadow-md"
                          : "bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{property.title}</h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {property.locality ? `${property.locality}, ` : ""}{property.city}
                          </p>
                        </div>
                        <span className="text-xs font-extrabold text-sky-700 shrink-0">
                          {isRent
                            ? `₹${priceVal.toLocaleString("en-IN")}/mo`
                            : `₹${(priceVal / 100000).toFixed(1)}L`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-3 text-[10px] text-slate-500 border-t border-slate-100 pt-2 font-medium">
                        <span>Area: {property.area} {property.areaUnit}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectProperty(property);
                            setIsDrawerOpen(true);
                          }}
                          className="text-sky-800 hover:text-sky-950 font-extrabold flex items-center gap-1 bg-sky-100 px-2.5 py-1 rounded-full border border-sky-200 cursor-pointer shadow-sm"
                        >
                          <Sparkles className="w-3 h-3 text-sky-600" />
                          <span>Ask GEB for Report</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Multi-Agent Drawer */}
      <SoilAgentDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        soilAnalysis={soilAnalysis}
        growthAnalysis={growthAnalysis}
        airAnalysis={airAnalysis}
        combinerAnalysis={combinerAnalysis}
        builderAnalysis={builderAnalysis}
      />
    </div>
  );
}
