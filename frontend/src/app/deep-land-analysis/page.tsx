"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Compass,
  MapPin,
  Bot,
  Loader2,
  Sparkles,
  TrendingUp,
  Sprout,
  Building2,
  ArrowDown,
  ExternalLink,
  Layers,
  Search,
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
import LandAnalysisFullReport from "@/components/land-analysis/LandAnalysisFullReport";

const DeepLandAnalysisMap = dynamic(
  () => import("@/components/map/DeepLandAnalysisMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[550px] bg-[var(--paper)]/80 rounded-3xl border border-[var(--stone-line)] flex flex-col items-center justify-center text-[var(--ink-soft)] gap-3 shadow-inner">
        <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
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

  // Search input state
  const [searchQuery, setSearchQuery] = useState("");

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
          handleSelectProperty(propsData[0], false);
        } else {
          handleSampleLocation(26.8467, 80.9462, false);
        }
      } catch (err) {
        console.error("Failed loading multi-agent page data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  const scrollToReport = () => {
    setTimeout(() => {
      const el = document.getElementById("report-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }, 150);
  };

  const handleSelectProperty = async (property: Property, autoScroll = true) => {
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

      if (autoScroll) {
        scrollToReport();
      }
    } catch (err) {
      console.error("Comprehensive land analysis error:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSampleLocation = async (lat: number, lng: number, autoScroll = true) => {
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

      if (autoScroll) {
        scrollToReport();
      }
    } catch (err) {
      console.error("Coordinate land analysis error:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const filteredProperties = properties.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      (p.locality && p.locality.toLowerCase().includes(q))
    );
  });

  const reportUrl = selectedProperty
    ? `/deep-land-analysis/report?property_id=${selectedProperty.id}&lat=${selectedProperty.latitude}&lng=${selectedProperty.longitude}`
    : sampledLocation
    ? `/deep-land-analysis/report?lat=${sampledLocation.lat}&lng=${sampledLocation.lng}`
    : "/deep-land-analysis/report";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#dbeafe]/40 via-[var(--paper)] to-[#f8fafc] text-[var(--ink)] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Hero Banner */}
        <div className="relative rounded-3xl bg-white/90 backdrop-blur-xl border border-white p-6 sm:p-8 overflow-hidden shadow-xl shadow-orange-900/5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-200/40 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-extrabold bg-orange-100 text-orange-700 border border-orange-200">
                <Compass className="w-3.5 h-3.5" />
                <span>GEB 5-Agent GIS Intelligence Suite</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-[var(--ink)] tracking-tight font-sans">
                Deep Land & Architectural Feasibility GIS
              </h1>
              <p className="text-xs sm:text-sm text-[var(--ink-soft)] font-medium">
                Autonomous multi-agent synthesis: Geotechnical Soil Bearing, Satellite Growth Corridors, Environmental AQI, Overall Suitability Index & Builder FAR Feasibility.
              </p>
            </div>

            {combinerAnalysis && (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={scrollToReport}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs transition-all shadow-xl shadow-orange-600/30 cursor-pointer border border-white/40"
                >
                  <ArrowDown className="w-4 h-4 text-amber-300" />
                  <span>Scroll to Full Report Below</span>
                </button>

                <Link
                  href={reportUrl}
                  target="_blank"
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white border border-[var(--stone-line)] hover:bg-[var(--paper)] text-[var(--ink)] font-bold text-xs transition-all shadow-sm"
                >
                  <ExternalLink className="w-4 h-4 text-orange-600" />
                  <span>Open Dedicated Page</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Intelligence Summary Bar */}
        {combinerAnalysis && builderAnalysis && soilAnalysis && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
            <div
              onClick={scrollToReport}
              className="bg-white/90 backdrop-blur-md border border-[var(--stone-line)] p-4 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <span className="text-[var(--ink-soft)] text-[11px]">GEB Land Suitability</span>
                <p className="text-lg font-extrabold text-orange-700 mt-0.5">
                  {combinerAnalysis.overall_suitability_score}/100 Index
                </p>
                <p className="text-[10px] text-[var(--ink-soft)]">Investment: {combinerAnalysis.investment_suitability_score}/100</p>
              </div>
              <Sparkles className="w-6 h-6 text-orange-600 group-hover:scale-110 transition-transform" />
            </div>

            <div
              onClick={scrollToReport}
              className="bg-white/90 backdrop-blur-md border border-[var(--stone-line)] p-4 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <span className="text-[var(--ink-soft)] text-[11px]">Builder FAR Potential</span>
                <p className="text-lg font-extrabold text-indigo-600 mt-0.5">
                  {builderAnalysis.potential_builtup_sqft} sqft
                </p>
                <p className="text-[10px] text-[var(--ink-soft)]">Est. {builderAnalysis.estimated_max_floors}</p>
              </div>
              <Building2 className="w-6 h-6 text-indigo-600 group-hover:scale-110 transition-transform" />
            </div>

            <div
              onClick={scrollToReport}
              className="bg-white/90 backdrop-blur-md border border-[var(--stone-line)] p-4 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <span className="text-[var(--ink-soft)] text-[11px]">Construction Feasibility</span>
                <p className="text-lg font-extrabold text-emerald-600 mt-0.5">
                  {soilAnalysis.construction_suitability_score}/100 Rating
                </p>
                <p className="text-[10px] text-[var(--ink-soft)]">Bearing: {soilAnalysis.bearing_capacity_kpa} kN/m²</p>
              </div>
              <Sprout className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform" />
            </div>

            <div
              onClick={scrollToReport}
              className="bg-white/90 backdrop-blur-md border border-[var(--stone-line)] p-4 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <span className="text-[var(--ink-soft)] text-[11px]">Growth & AQI Index</span>
                <p className="text-lg font-extrabold text-cyan-600 mt-0.5">
                  {growthAnalysis?.appreciation_velocity_score ?? 90}/100 Rating
                </p>
                <p className="text-[10px] text-[var(--ink-soft)]">AQI: {airAnalysis?.aqi ?? 75} ({airAnalysis?.aqi_category})</p>
              </div>
              <TrendingUp className="w-6 h-6 text-cyan-600 group-hover:scale-110 transition-transform" />
            </div>
          </div>
        )}

        {/* GIS Map & Active Listings Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* GIS Map Canvas Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="h-[600px] w-full relative rounded-3xl overflow-hidden border border-[var(--stone-line)] shadow-xl">
              {analyzing && (
                <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center text-orange-700 font-bold text-xs gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
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
                onSelectProperty={(prop) => handleSelectProperty(prop, true)}
                onSampleLocation={(lat, lng) => handleSampleLocation(lat, lng, true)}
              />
            </div>
          </div>

          {/* Active Listings Sidebar */}
          <div className="space-y-4">
            <div className="bg-white border border-[var(--stone-line)] rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--stone-line)] pb-3">
                <h2 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-600" />
                  <span>Active Land Listings</span>
                </h2>
                <span className="text-xs text-[var(--ink-soft)] font-semibold">{filteredProperties.length} Plots</span>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]" />
                <input
                  type="text"
                  placeholder="Filter land listings by city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[var(--paper)] text-xs rounded-xl pl-8 pr-3 py-2 border border-[var(--stone-line)] outline-none focus:border-orange-600 text-[var(--ink)] font-medium"
                />
              </div>

              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {filteredProperties.map((property) => {
                  const isSelected = selectedProperty?.id === property.id;
                  const isRent = property.listingType === "rent" || property.title.toLowerCase().includes("rent");
                  const priceVal = property.monthlyRent || property.price;

                  return (
                    <div
                      key={property.id}
                      onClick={() => handleSelectProperty(property, true)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-orange-50 border-orange-500/80 shadow-md"
                          : "bg-[var(--paper)]/70 border-[var(--stone-line)] hover:border-orange-300 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-xs font-bold text-[var(--ink)] line-clamp-1">{property.title}</h3>
                          <p className="text-[11px] text-[var(--ink-soft)] mt-0.5">
                            {property.locality ? `${property.locality}, ` : ""}{property.city}
                          </p>
                        </div>
                        <span className="text-xs font-extrabold text-orange-700 shrink-0">
                          {isRent
                            ? `₹${priceVal.toLocaleString("en-IN")}/mo`
                            : `₹${(priceVal / 100000).toFixed(1)}L`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-3 text-[10px] text-[var(--ink-soft)] border-t border-[var(--stone-line)] pt-2 font-medium">
                        <span>Area: {property.area} {property.areaUnit}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectProperty(property, true);
                          }}
                          className="text-orange-800 hover:text-orange-950 font-extrabold flex items-center gap-1 bg-orange-100 px-2.5 py-1 rounded-full border border-orange-200 cursor-pointer shadow-sm"
                        >
                          <Sparkles className="w-3 h-3 text-orange-600" />
                          <span>View Full Report</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* FULL-WIDTH COMPREHENSIVE REPORT & AI ASK QUESTION ASSISTANT SECTION BELOW MAP */}
        <div className="pt-4">
          {analyzing ? (
            <div className="w-full h-64 bg-white rounded-3xl border border-[var(--stone-line)] flex flex-col items-center justify-center text-[var(--ink-soft)] gap-3 shadow-xl">
              <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
              <span className="text-sm font-extrabold text-[var(--ink)]">Synthesizing Land Analysis Report...</span>
            </div>
          ) : (
            <LandAnalysisFullReport
              soilAnalysis={soilAnalysis}
              growthAnalysis={growthAnalysis}
              airAnalysis={airAnalysis}
              combinerAnalysis={combinerAnalysis}
              builderAnalysis={builderAnalysis}
              title={selectedProperty?.title || (sampledLocation ? `Sampled Location (${sampledLocation.lat.toFixed(4)}, ${sampledLocation.lng.toFixed(4)})` : "Land Parcel Analysis")}
              locationLabel={selectedProperty ? `${selectedProperty.locality ? `${selectedProperty.locality}, ` : ""}${selectedProperty.city}` : sampledLocation ? `${sampledLocation.lat.toFixed(4)}, ${sampledLocation.lng.toFixed(4)}` : undefined}
            />
          )}
        </div>
      </main>
    </div>
  );
}
