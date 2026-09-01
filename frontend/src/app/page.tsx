"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ChevronDown,
  MapPin,
  Search,
  Sparkles,
  Zap,
  RotateCcw,
  MessageSquare,
  Loader2,
  Heart,
  X,
} from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import PropertyCard from "@/components/properties/PropertyCard";
import GEBAIChat from "@/components/ai/GEBAIChat";
import GEBChatModal from "@/components/chat/GEBChatModal";
import { useAuth } from "@/components/auth/AuthProvider";
import { getProperties } from "@/services/properties";
import { filterProperties } from "@/lib/propertySearch";
import { Property } from "@/types/property";
import { Conversation, getOrCreateConversation } from "@/services/conversations";

const PropertyMap = dynamic(
  () => import("@/components/map/PropertyMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[360px] items-center justify-center bg-zinc-100">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-400" />
          Loading GEB map...
        </div>
      </div>
    ),
  }
);

const propertyTypes = [
  { label: "Any type", value: "all" },
  { label: "Plot", value: "plot" },
  { label: "House", value: "house" },
  { label: "Apartment", value: "apartment" },
  { label: "Villa", value: "villa" },
  { label: "Commercial", value: "commercial" },
];

const budgets = [
  {
    label: "Any budget",
    min: undefined,
    max: undefined,
  },
  {
    label: "Under ₹30L",
    min: undefined,
    max: 3000000,
  },
  {
    label: "₹30L – ₹50L",
    min: 3000000,
    max: 5000000,
  },
  {
    label: "₹50L – ₹1Cr",
    min: 5000000,
    max: 10000000,
  },
  {
    label: "₹1Cr+",
    min: 10000000,
    max: undefined,
  },
];

const SEARCH_RADIUS_KM = 10;

export default function Home() {

  const {
    user,
    roles,
    loading: authLoading,
    signOut,
  } = useAuth();


  /*
   * ==========================================================
   * PROPERTY DATA
   * ==========================================================
   *
   * Properties now come from:
   *
   * Next.js
   *    ↓
   * FastAPI
   *    ↓
   * Supabase
   *
   * instead of hardcoded demo data.
   */

  const [allProperties, setAllProperties] =
    useState<Property[]>([]);

  const [loadingProperties, setLoadingProperties] =
    useState(true);

  const [propertyError, setPropertyError] =
    useState("");


  /*
   * ==========================================================
   * SEARCH STATE
   * ==========================================================
   */

  const [location, setLocation] = useState("");

  const [propertyType, setPropertyType] =
    useState("all");

  const [listingTypeFilter, setListingTypeFilter] =
    useState("all");

  const [budgetIndex, setBudgetIndex] =
    useState(0);

  const [appliedLocation, setAppliedLocation] =
    useState("");

  const [appliedPropertyType, setAppliedPropertyType] =
    useState("all");

  const [appliedBudgetIndex, setAppliedBudgetIndex] =
    useState(0);

  const [searchedLatitude, setSearchedLatitude] =
    useState<number | undefined>();

  const [searchedLongitude, setSearchedLongitude] =
    useState<number | undefined>();

  const [searchedLocationName, setSearchedLocationName] =
    useState("");

  const [selectedProperty, setSelectedProperty] =
    useState<Property | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");

  const [chatOpen, setChatOpen] = useState(false);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState("");

  const [isSaved, setIsSaved] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  useEffect(() => {
    if (selectedProperty) {
      const savedIdsStr = localStorage.getItem("geb_saved_properties");
      const savedIds: string[] = savedIdsStr ? JSON.parse(savedIdsStr) : [];
      setIsSaved(savedIds.includes(selectedProperty.id));
    }
  }, [selectedProperty]);

  const handleToggleSave = () => {
    if (!selectedProperty) return;
    const savedIdsStr = localStorage.getItem("geb_saved_properties");
    let savedIds: string[] = savedIdsStr ? JSON.parse(savedIdsStr) : [];
    if (savedIds.includes(selectedProperty.id)) {
      savedIds = savedIds.filter(id => id !== selectedProperty.id);
      setIsSaved(false);
    } else {
      savedIds.push(selectedProperty.id);
      setIsSaved(true);
    }
    localStorage.setItem("geb_saved_properties", JSON.stringify(savedIds));
  };

  async function handleContactSeller(propertyId: string) {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    try {
      setContactLoading(true);
      setContactError("");
      const result = await getOrCreateConversation(propertyId);
      setActiveConversation(result.conversation);
      setChatOpen(true);
    } catch (err: any) {
      setContactError(err.message || "Failed to contact seller.");
    } finally {
      setContactLoading(false);
    }
  }

  /*
   * ==========================================================
   * LOAD PROPERTIES FROM FASTAPI
   * ==========================================================
   */
  useEffect(() => {
    let mounted = true;

    async function loadProperties() {
      try {
        setLoadingProperties(true);
        setPropertyError("");

        const properties = await getProperties();

        if (!mounted) {
          return;
        }

        setAllProperties(properties);
      } catch (error) {
        console.error(
          "Failed to load GEB properties:",
          error
        );

        if (!mounted) {
          return;
        }

        setPropertyError(
          "Unable to load properties. Please make sure the GEB backend is running."
        );
      } finally {
        if (mounted) {
          setLoadingProperties(false);
        }
      }
    }

    loadProperties();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * ==========================================================
   * SELECTED BUDGET
   * ==========================================================
   */
  const selectedBudget = budgets[appliedBudgetIndex];

  /*
   * ==========================================================
   * FILTER PROPERTIES
   * ==========================================================
   */

  const locationSuggestions = useMemo(() => {
    const suggestionsSet = new Set<string>();
    allProperties.forEach((prop) => {
      if (prop.city) {
        suggestionsSet.add(prop.city.trim());
      }
      if (prop.locality) {
        suggestionsSet.add(prop.locality.trim());
        if (prop.city) {
          suggestionsSet.add(`${prop.locality.trim()}, ${prop.city.trim()}`);
        }
      }
    });
    return Array.from(suggestionsSet);
  }, [allProperties]);

  const filteredSuggestions = useMemo(() => {
    const query = location.trim().toLowerCase();
    if (!query) {
      return locationSuggestions.slice(0, 8);
    }
    return locationSuggestions
      .filter((s) => s.toLowerCase().includes(query))
      .slice(0, 8);
  }, [location, locationSuggestions]);
  
  const filteredProperties = useMemo(() => {
    return filterProperties(
      allProperties,
      {
        query:
          appliedLocation || undefined,

        propertyType:
          appliedPropertyType,

        listingType:
          listingTypeFilter,

        minPrice:
          selectedBudget.min,

        maxPrice:
          selectedBudget.max,

        latitude:
          searchedLatitude,

        longitude:
          searchedLongitude,

        radiusKm:
          searchedLatitude !== undefined &&
          searchedLongitude !== undefined
            ? SEARCH_RADIUS_KM
            : undefined,
      }
    );
  }, [
    allProperties,
    appliedLocation,
    appliedPropertyType,
    listingTypeFilter,
    selectedBudget.min,
    selectedBudget.max,
    searchedLatitude,
    searchedLongitude,
  ]);


  /*
   * ==========================================================
   * HERO SEARCH
   * ==========================================================
   */

  function handleSearch() {
    setAppliedLocation(
      location.trim()
    );

    setAppliedPropertyType(
      propertyType
    );

    setAppliedBudgetIndex(
      budgetIndex
    );

    /*
     * A manual hero search clears
     * previous map coordinates.
     */

    setSearchedLatitude(
      undefined
    );

    setSearchedLongitude(
      undefined
    );

    setSearchedLocationName("");

    setSelectedProperty(null);

    if (
      location.trim() ||
      propertyType !== "all" ||
      budgetIndex !== 0
    ) {
      setSearchMessage(
        "Search updated"
      );
    } else {
      setSearchMessage("");
    }
  }


  /*
   * ==========================================================
   * MAP LOCATION SEARCH
   * ==========================================================
   */

  function handleMapLocationSearch(
    latitude: number,
    longitude: number,
    locationName: string
  ) {
    setSearchedLatitude(
      latitude
    );

    setSearchedLongitude(
      longitude
    );

    setSearchedLocationName(
      locationName
    );

    /*
     * Synchronize hero location.
     */

    setLocation(
      locationName
    );

    /*
     * Coordinates are more accurate
     * than textual filtering.
     */

    setAppliedLocation("");

    setSelectedProperty(null);

    setSearchMessage(
      `Showing properties within ${SEARCH_RADIUS_KM} km`
    );
  }


  /*
   * ==========================================================
   * RESET SEARCH
   * ==========================================================
   */

  function resetSearch() {
    setLocation("");

    setPropertyType(
      "all"
    );

    setBudgetIndex(0);

    setAppliedLocation("");

    setAppliedPropertyType(
      "all"
    );

    setAppliedBudgetIndex(0);

    setSearchedLatitude(
      undefined
    );

    setSearchedLongitude(
      undefined
    );

    setSearchedLocationName("");

    setSelectedProperty(null);

    setSearchMessage("");
  }


  return (
    <main className="relative min-h-screen bg-slate-900 font-sans text-slate-900 overflow-x-hidden">
      {/* Full-Bleed Fixed Architectural Background Wallpaper */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none z-0 scale-105"
        style={{ backgroundImage: `url('/hero-house.png')` }}
      />
      {/* Light Luxury Glass Overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-slate-900/40 via-slate-50/85 to-[#f8fafc]/95 pointer-events-none z-0 backdrop-blur-[2px]" />

      <div className="relative z-10 space-y-4">
        {/* =====================================================
            GLOBAL NAVBAR
        ===================================================== */}
        <Navbar onOpenAIChat={() => setAiOpen(true)} />

        {/* =====================================================
            HERO BANNER - MATCHED TO INSPIRATION IMAGE 2
        ===================================================== */}
        <section className="relative pt-4 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center space-y-4 pt-4 pb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-sky-200/80 text-sky-700 text-xs font-extrabold shadow-sm backdrop-blur">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Real Estate Intelligence & GIS Suite</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight font-sans max-w-4xl mx-auto leading-tight">
              Find The Perfect Getaway & Investment For You Now!
            </h1>

            <p className="text-slate-700 text-sm sm:text-base max-w-2xl mx-auto font-semibold">
              You will have everything nearby: supermarkets, transit, schools, prime growth corridors, verified soil stability & environmental air quality.
            </p>
          </div>

          {/* Floating Search Panel - Direct glassmorphic floating box */}
          <div className="relative z-10 bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/80 max-w-5xl mx-auto w-full my-6">
            {/* Buy / Rent Tab Switcher */}
            <div className="inline-flex bg-slate-100 p-1 rounded-2xl mb-4 font-bold text-xs">
              <button
                type="button"
                onClick={() => setListingTypeFilter("sale")}
                className={`px-6 py-2.5 rounded-xl transition-all cursor-pointer ${
                  listingTypeFilter === "sale" || listingTypeFilter === "all"
                    ? "bg-white text-sky-700 shadow-md font-extrabold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Buy
              </button>
              <button
                type="button"
                onClick={() => setListingTypeFilter("rent")}
                className={`px-6 py-2.5 rounded-xl transition-all cursor-pointer ${
                  listingTypeFilter === "rent"
                    ? "bg-sky-600 text-white shadow-md font-extrabold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Rent
              </button>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
              {/* Location Input */}
              <div className="relative bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col justify-center">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Location</span>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
                  <input
                    ref={inputRef}
                    value={location}
                    onFocus={() => setShowSuggestions(true)}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      setShowSuggestions(true);
                    }}
                    placeholder="Lucknow, Uttar Pradesh"
                    className="w-full bg-transparent text-xs font-bold text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>

                {/* Suggestions dropdown */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute left-0 right-0 top-full z-50 mt-2 max-h-56 overflow-y-auto rounded-2xl bg-white border border-slate-200 p-2 shadow-2xl"
                  >
                    {filteredSuggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setLocation(s);
                          setAppliedLocation(s);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-sky-50 rounded-xl transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Property Type Dropdown */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col justify-center">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Property Type</span>
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="w-4 h-4 text-sky-600 shrink-0" />
                  <select
                    value={propertyType}
                    onChange={(e) => {
                      setPropertyType(e.target.value);
                      setAppliedPropertyType(e.target.value);
                    }}
                    className="w-full bg-transparent text-xs font-bold text-slate-900 outline-none cursor-pointer"
                  >
                    {propertyTypes.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price Dropdown */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col justify-center">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Price Range</span>
                <div className="flex items-center gap-2 mt-1">
                  <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
                  <select
                    value={budgetIndex}
                    onChange={(e) => {
                      const idx = Number(e.target.value);
                      setBudgetIndex(idx);
                      setAppliedBudgetIndex(idx);
                    }}
                    className="w-full bg-transparent text-xs font-bold text-slate-900 outline-none cursor-pointer"
                  >
                    {budgets.map((b, i) => (
                      <option key={i} value={i}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Search Button */}
              <button
                type="button"
                onClick={handleSearch}
                className="w-full h-full py-3.5 px-6 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs transition-all shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Search Properties</span>
              </button>
            </div>
          </div>
        </section>

      {/* =====================================================
          FEATURES GRID (DISCOVERABILITY)
      ===================================================== */}
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 font-semibold">
          GEB ECOSYSTEM
        </span>
        <h2 className="mt-2 font-serif text-3xl font-medium tracking-tight">
          Major Platform Features
        </h2>
        
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* PROPERTY DISCOVERY */}
          <div className="bg-white border border-black/5 p-6 rounded-[2rem] shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 mb-4">
                <Building2 size={20} />
              </div>
              <h4 className="text-sm font-bold text-zinc-900 uppercase">Property Discovery</h4>
              <p className="mt-2 text-xs text-zinc-500 leading-relaxed font-semibold">
                Search, filter, and explore active real-estate opportunities in your target areas.
              </p>
            </div>
            <button
              onClick={() => {
                document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="mt-6 text-xs font-bold text-zinc-950 hover:text-zinc-500 self-start underline cursor-pointer"
            >
              Explore Listings
            </button>
          </div>

          {/* GEB AI */}
          <div className="bg-white border border-black/5 p-6 rounded-[2rem] shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 mb-4">
                <Sparkles size={20} />
              </div>
              <h4 className="text-sm font-bold text-zinc-900 uppercase">GEB AI Chatbot</h4>
              <p className="mt-2 text-xs text-zinc-500 leading-relaxed font-semibold">
                Ask natural language queries to analyze market deals and find appropriate properties.
              </p>
            </div>
            <button
              onClick={() => setAiOpen(true)}
              className="mt-6 text-xs font-bold text-purple-700 hover:text-purple-900 self-start underline cursor-pointer"
            >
              Ask GEB AI
            </button>
          </div>

          {/* INVESTMENT ADVISOR */}
          <div className="bg-white border border-black/5 p-6 rounded-[2rem] shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500 mb-4">
                <Zap size={20} />
              </div>
              <h4 className="text-sm font-bold text-zinc-900 uppercase">Investment Advisor</h4>
              <p className="mt-2 text-xs text-zinc-500 leading-relaxed font-semibold">
                Evaluate suitability based on budget limits, risk tolerance, and time horizon targets.
              </p>
            </div>
            <button
              onClick={() => setAiOpen(true)}
              className="mt-6 text-xs font-bold text-amber-700 hover:text-amber-900 self-start underline cursor-pointer"
            >
              Get Suitability Score
            </button>
          </div>

          {/* SELLER CRM */}
          <div className="bg-white border border-black/5 p-6 rounded-[2rem] shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-4">
                <Building2 size={20} />
              </div>
              <h4 className="text-sm font-bold text-zinc-900 uppercase">Seller CRM</h4>
              <p className="mt-2 text-xs text-zinc-500 leading-relaxed font-semibold">
                Organize discussions, capture client leads, schedule site visits, and reply to buyers.
              </p>
            </div>
            <Link
              href="/seller-dashboard"
              className="mt-6 text-xs font-bold text-emerald-700 hover:text-emerald-900 self-start underline"
            >
              Seller Dashboard
            </Link>
          </div>

          {/* DIRECT CHAT */}
          <div className="bg-white border border-black/5 p-6 rounded-[2rem] shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-500 mb-4">
                <MessageSquare size={20} />
              </div>
              <h4 className="text-sm font-bold text-zinc-900 uppercase">Direct Chat</h4>
              <p className="mt-2 text-xs text-zinc-500 leading-relaxed font-semibold">
                Talk directly with verified property sellers with full history persistence.
              </p>
            </div>
            <Link
              href="/buyer-dashboard?tab=conversations"
              className="mt-6 text-xs font-bold text-blue-700 hover:text-blue-900 self-start underline"
            >
              Open Conversations
            </Link>
          </div>

          {/* MEETINGS COORDINATION */}
          <div className="bg-white border border-black/5 p-6 rounded-[2rem] shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500 mb-4">
                <MessageSquare size={20} />
              </div>
              <h4 className="text-sm font-bold text-zinc-900 uppercase">Meetings</h4>
              <p className="mt-2 text-xs text-zinc-500 leading-relaxed font-semibold">
                Propose, confirm, and coordinate site visits or reschedule requested slots.
              </p>
            </div>
            <Link
              href={roles.includes("seller") ? "/seller-dashboard?tab=meetings" : "/buyer-dashboard?tab=meetings"}
              className="mt-6 text-xs font-bold text-rose-700 hover:text-rose-900 self-start underline"
            >
              Manage Meetings
            </Link>
          </div>

          {/* DEEP LAND ANALYSIS & SOIL AGENT */}
          <div className="bg-emerald-950 text-white border border-emerald-800 p-6 rounded-[2rem] shadow-lg flex flex-col justify-between hover:shadow-emerald-900/20 transition">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 mb-4">
                <Zap size={20} />
              </div>
              <h4 className="text-sm font-extrabold text-emerald-400 uppercase tracking-wider">Deep Land Analysis & Soil Agent</h4>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed font-medium">
                Geotechnical bearing capacity, soil pH, NPK profiles, foundation feasibility, and autonomous Soil AI Co-Pilot.
              </p>
            </div>
            <Link
              href="/deep-land-analysis"
              className="mt-6 text-xs font-bold text-emerald-400 hover:text-emerald-300 self-start underline flex items-center gap-1"
            >
              Launch Soil Map Agent →
            </Link>
          </div>

          {/* VERIFIED PROPERTIES - ROADMAP */}
          <div className="bg-zinc-50 border border-zinc-200/50 p-6 rounded-[2rem] flex flex-col justify-between opacity-80">
            <div>
              <span className="text-[9px] font-bold text-zinc-400 bg-zinc-200 px-2 py-0.5 rounded-full uppercase">Roadmap</span>
              <h4 className="mt-4 text-sm font-bold text-zinc-400 uppercase">Verified Properties</h4>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed font-semibold">
                Verify title deeds, road widths, and photo geolocations before making investment decisions.
              </p>
            </div>
            <span className="mt-6 text-xs font-bold text-zinc-300 self-start">Coming Soon</span>
          </div>

          {/* DOCUMENTS - ROADMAP */}
          <div className="bg-zinc-50 border border-zinc-200/50 p-6 rounded-[2rem] flex flex-col justify-between opacity-80">
            <div>
              <span className="text-[9px] font-bold text-zinc-400 bg-zinc-200 px-2 py-0.5 rounded-full uppercase">Roadmap</span>
              <h4 className="mt-4 text-sm font-bold text-zinc-400 uppercase">Documents Exchange</h4>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed font-semibold">
                Request registry papers and documents securely within the platform workspace.
              </p>
            </div>
            <span className="mt-6 text-xs font-bold text-zinc-300 self-start">Coming Soon</span>
          </div>

          {/* INSTANT BROKER - ROADMAP */}
          <div className="bg-zinc-50 border border-zinc-200/50 p-6 rounded-[2rem] flex flex-col justify-between opacity-80">
            <div>
              <span className="text-[9px] font-bold text-zinc-400 bg-zinc-200 px-2 py-0.5 rounded-full uppercase">Roadmap</span>
              <h4 className="mt-4 text-sm font-bold text-zinc-400 uppercase">Instant Broker</h4>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed font-semibold">
                Connect in real-time with top local real-estate experts to source prime off-market deals.
              </p>
            </div>
            <span className="mt-6 text-xs font-bold text-zinc-300 self-start">Coming Soon</span>
          </div>
        </div>
      </section>

      {/* =====================================================
          MARKET MAP
      ===================================================== */}

      <section
        id="explore"
        className="mx-auto max-w-7xl px-6 py-6 lg:px-8"
      >

        <div className="mb-5 flex items-end justify-between">

          <div>

            <p className="mb-1.5 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Explore the market
            </p>

            <h2 className="font-serif text-4xl font-medium tracking-tight md:text-5xl">
              Properties around you.
            </h2>

          </div>


          <div className="hidden text-right md:block">

            <p className="text-2xl font-semibold">
              {loadingProperties
                ? "—"
                : filteredProperties.length}
            </p>

            <p className="text-sm text-zinc-400">
              matching opportunities
            </p>

          </div>

        </div>


        {/* MAP */}

        <div className="rounded-[2rem] border border-zinc-200 bg-white p-2 shadow-lg shadow-black/5">

          <div className="relative h-[360px] overflow-hidden rounded-[1.5rem]">

            {!loadingProperties &&
            !propertyError ? (

              <PropertyMap
                properties={filteredProperties}
                selectedPropertyId={
                  selectedProperty?.id
                }
                onPropertySelect={
                  setSelectedProperty
                }
                onLocationSearch={
                  handleMapLocationSearch
                }
              />

            ) : (

              <div className="flex h-full items-center justify-center bg-zinc-100">

                <div className="text-center">

                  {propertyError ? (

                    <>
                      <p className="text-sm font-semibold text-red-500">
                        Unable to load GEB properties
                      </p>

                      <p className="mt-1 text-xs text-zinc-400">
                        Make sure the backend is running on port 8000.
                      </p>
                    </>

                  ) : (

                    <>
                      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />

                      <p className="text-sm font-medium text-zinc-400">
                        Loading GEB properties...
                      </p>
                    </>

                  )}

                </div>

              </div>

            )}


            {/* LEGEND */}

            <div className="absolute bottom-4 left-4 z-[1000] rounded-2xl border border-black/5 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-md">

              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                Listing source
              </p>

              <div className="flex items-center gap-4 text-xs font-medium text-zinc-600">

                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-zinc-950" />
                  GEB
                </span>

                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-zinc-500" />
                  External
                </span>

                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-zinc-700" />
                  Broker
                </span>

              </div>

            </div>


            {/* LIVE STATUS */}

            <div className="absolute right-4 top-4 z-[1000] flex items-center gap-2 rounded-full border border-black/5 bg-white/95 px-4 py-2 text-xs font-semibold shadow-lg backdrop-blur-md">

              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />

              {loadingProperties
                ? "Loading properties"
                : searchedLocationName
                  ? `${filteredProperties.length} nearby`
                  : "Live opportunities"}

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          PROPERTIES
      ===================================================== */}

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">

        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="mb-1.5 text-xs font-extrabold uppercase tracking-widest text-sky-700">
              Live Property Marketplace
            </p>
            <h2 className="font-sans text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Verified Properties Around You
            </h2>
          </div>

          <div className="text-xs font-extrabold text-slate-500">
            {loadingProperties
              ? "Loading opportunities..."
              : `${filteredProperties.length} active listings`}
          </div>
        </div>

        {/* Interactive Filter Control Bar */}
        <div className="mb-8 bg-white/90 backdrop-blur-md border border-slate-200 p-4 rounded-3xl shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* All | Buy | Rent Segmented Bar */}
            <div className="inline-flex bg-slate-100 p-1 rounded-2xl font-bold text-xs">
              <button
                type="button"
                onClick={() => setListingTypeFilter("all")}
                className={`px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
                  listingTypeFilter === "all"
                    ? "bg-white text-slate-900 shadow-sm font-extrabold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setListingTypeFilter("sale")}
                className={`px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
                  listingTypeFilter === "sale"
                    ? "bg-sky-600 text-white shadow-md font-extrabold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Buy (Sale)
              </button>
              <button
                type="button"
                onClick={() => setListingTypeFilter("rent")}
                className={`px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
                  listingTypeFilter === "rent"
                    ? "bg-sky-600 text-white shadow-md font-extrabold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Rent
              </button>
            </div>

            {/* Property Type Pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              {propertyTypes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    setPropertyType(t.value);
                    setAppliedPropertyType(t.value);
                  }}
                  className={`px-4 py-2 rounded-xl border transition-all cursor-pointer ${
                    appliedPropertyType === t.value
                      ? "bg-slate-900 text-white border-slate-900 font-extrabold shadow-sm"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>


        {/* =====================================================
            LOADING
        ===================================================== */}

        {loadingProperties ? (

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

            {[1, 2, 3].map(
              (item) => (

                <div
                  key={item}
                  className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white"
                >

                  <div className="h-64 animate-pulse bg-zinc-200" />

                  <div className="space-y-3 p-5">

                    <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-200" />

                    <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-200" />

                    <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-200" />

                  </div>

                </div>

              )
            )}

          </div>

        ) : propertyError ? (

          <div className="rounded-[2rem] border border-red-100 bg-white px-6 py-16 text-center">

            <Search
              className="mx-auto mb-4 text-red-300"
              size={32}
            />

            <h3 className="text-xl font-semibold">
              Unable to load properties
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
              Make sure your GEB FastAPI backend is running on
              <span className="font-semibold">
                {" "}localhost:8000
              </span>
              .
            </p>

            <button
              onClick={() =>
                window.location.reload()
              }
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white"
            >

              <RotateCcw size={15} />

              Try again

            </button>

          </div>

        ) : filteredProperties.length > 0 ? (

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

            {filteredProperties.map(
              (property) => (

                <div
                  key={property.id}
                  onClick={() =>
                    setSelectedProperty(
                      property
                    )
                  }
                  className="cursor-pointer"
                >

                  <PropertyCard
                    property={property}
                  />

                </div>

              )
            )}

          </div>

        ) : (

          <div className="rounded-[2rem] border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">

            <Search
              className="mx-auto mb-4 text-zinc-300"
              size={32}
            />

            <h3 className="text-xl font-semibold">
              No properties nearby
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
              There are currently no properties matching
              your search within {SEARCH_RADIUS_KM} km.
            </p>

            <button
              onClick={resetSearch}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white"
            >

              <RotateCcw size={15} />

              Clear filters

            </button>

          </div>

        )}

      </section>

      {/* =====================================================
          CRM SECTION
      ===================================================== */}
      <section
        id="crm"
        className="mx-auto max-w-7xl px-6 py-16 lg:px-8 border-t border-black/5"
      >
        <div className="rounded-[2.5rem] bg-zinc-950 p-8 text-white md:p-12 shadow-xl">
          <div className="max-w-3xl">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
              GEB FOR OWNERS & AGENTS
            </span>
            <h2 className="mt-4 font-serif text-4xl md:text-5xl font-medium tracking-tight leading-none">
              SELL PROPERTY. <br className="sm:hidden" />
              GET BUYERS. <br className="sm:hidden" />
              MANAGE EVERYTHING.
            </h2>
            <p className="mt-6 text-zinc-400 leading-8 text-base md:text-lg">
              GEB doesn&apos;t stop at property discovery. Sellers get an integrated,
              database-backed CRM to coordinate and handle:
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 text-sm text-zinc-300 font-semibold">
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> Property listings & status
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> Buyer enquiries & analytics
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> Dynamic persistent chats
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> Flagged yield & legal follow-ups
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> Visit schedule requests
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> Hybrid AI Co-pilot takeover
              </li>
            </ul>
            <p className="mt-6 text-xs text-zinc-500 italic font-semibold">
              Every buyer interaction stays connected directly to the property context.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => setAiOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-white text-zinc-950 px-6 py-3 font-bold text-sm transition hover:bg-zinc-200 cursor-pointer"
              >
                Explore GEB AI
                <Sparkles size={14} className="text-purple-600" />
              </button>
              <Link
                href="/seller-dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 px-6 py-3 font-bold text-sm transition"
              >
                Seller Dashboard
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          BUYER EXPERIENCE FLOW SECTION
      ===================================================== */}
      <section
        id="about"
        className="mx-auto max-w-7xl px-6 py-16 lg:px-8 border-t border-black/5"
      >
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
            TRY THE BUYER EXPERIENCE
          </span>
          <h2 className="mt-4 font-serif text-4xl md:text-5xl font-medium tracking-tight">
            How GEB Connects Buyers &amp; Sellers
          </h2>
          <p className="mt-4 text-zinc-500 leading-7">
            Experience the real, integrated loop by performing the buyer actions below and watching how the seller immediately manages them in the CRM.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5 relative">
          {[
            {
              step: "1",
              title: "Search Properties",
              desc: "Find listed plots or villas in Lucknow on the map grid.",
            },
            {
              step: "2",
              title: "Ask GEB AI",
              desc: "Get personalized suitability analysis and investment feedback.",
            },
            {
              step: "3",
              title: "Contact Seller",
              desc: "Initiate conversation on a property to trigger AI co-pilot.",
            },
            {
              step: "4",
              title: "Seller CRM Logs",
              desc: "Seller receives purchase intent, follow-up or visit request.",
            },
            {
              step: "5",
              title: "Active Response",
              desc: "Seller takes over co-pilot and replies directly in the chat.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-black/5 p-6 rounded-[2rem] shadow-sm flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-950 text-xs font-bold text-white">
                  {item.step}
                </span>
                <h4 className="mt-4 text-sm font-bold text-zinc-900 leading-tight">{item.title}</h4>
                <p className="mt-2 text-xs leading-relaxed text-zinc-500 font-semibold">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={() => {
              document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex items-center gap-2 rounded-full bg-zinc-950 text-white px-6 py-3.5 font-bold text-sm transition hover:bg-zinc-800 cursor-pointer"
          >
            Try GEB as a Buyer
          </button>
        </div>
      </section>

      {/* =====================================================
          INSTANT BUYER
      ===================================================== */}

      <section
        id="instant"
        className="mx-auto max-w-7xl px-6 py-12 lg:px-8"
      >

        <div className="overflow-hidden rounded-[2.5rem] bg-zinc-950 p-8 text-white md:p-12">

          <div className="max-w-2xl">

            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <Zap />
            </div>

            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-400">
              Instant Buyer
            </p>

            <h2 className="font-serif text-5xl font-medium tracking-tight">
              Need a property fast?
            </h2>

            <p className="mt-5 leading-7 text-zinc-400">
              Tell GEB what you need and connect with local brokers who can
              help you find the right property quickly.
            </p>

            <button className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-zinc-950 transition hover:bg-zinc-200">

              Find local experts

              <ArrowRight size={17} />

            </button>

          </div>

        </div>

      </section>


      {/* =====================================================
          BROKERS
      ===================================================== */}

      <section
        id="brokers"
        className="mx-auto max-w-7xl px-6 py-16 text-center lg:px-8"
      >

        <Building2
          className="mx-auto mb-5"
          size={30}
        />

        <h2 className="font-serif text-5xl font-medium tracking-tight">

          Real estate decisions,

          <br />

          powered by intelligence.

        </h2>

        <p className="mx-auto mt-5 max-w-xl leading-7 text-zinc-500">

          GEB brings property discovery, AI analysis, sellers and local experts
          together in one experience.

        </p>

      </section>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="border-t border-black/5 px-6 py-8 text-center text-sm text-zinc-400">

        © 2026 GEB · Global Estate Bridge

      </footer>

      <GEBAIChat
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onPropertySelect={(property) => {
          setSelectedProperty({
            id: property.id,
            title: property.title,
            propertyType:
              property.property_type as
                "plot" |
                "house" |
                "apartment" |
                "commercial" |
                "villa",
            price: property.price,
            area: property.area ?? 0,
            areaUnit:
              property.area_unit === "sqm"
                ? "sqm"
                : "sqft",
            city: property.city,
            locality: property.locality ?? "",
            latitude: property.latitude,
            longitude: property.longitude,
            image: property.image ?? "",
            images: property.images ?? (
              property.image
                ? [property.image]
                : []
            ),
            source: property.source,
            sourceName: property.source_name ?? property.source,
            sourceUrl: property.source_url,
            investmentScore:
              property.investment_score,
            featured: false,
            status: "active",
            description: property.description,
          });

          setAiOpen(false);
        }}
      />

      <GEBChatModal
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        directConversation={activeConversation}
        initialMode="buyer"
      />

      {selectedProperty && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedProperty(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative">
              {selectedProperty.image && (
                <img
                  src={selectedProperty.image}
                  alt={selectedProperty.title}
                  className="h-72 w-full object-cover md:h-96"
                />
              )}

              <button
                onClick={handleToggleSave}
                className="absolute right-16 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-zinc-900 shadow-lg transition hover:bg-white cursor-pointer"
                aria-label={isSaved ? "Unsave Property" : "Save Property"}
              >
                <Heart size={18} className={isSaved ? "text-red-500 fill-red-500" : "text-zinc-400"} />
              </button>

              <button
                onClick={() => setSelectedProperty(null)}
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-xl font-medium shadow-lg transition hover:bg-white"
                aria-label="Close property details"
              >
                ×
              </button>

              <div className="absolute bottom-4 left-4 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold uppercase tracking-wide shadow-lg">
                {selectedProperty.propertyType}
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-3xl font-bold tracking-tight">
                    ₹{selectedProperty.price.toLocaleString("en-IN")}
                  </p>

                  <h2 className="mt-2 font-serif text-4xl font-medium tracking-tight">
                    {selectedProperty.title}
                  </h2>

                  <div className="mt-3 flex items-center gap-2 text-sm text-zinc-500">
                    <MapPin size={16} />
                    {selectedProperty.locality
                      ? `${selectedProperty.locality}, `
                      : ""}
                    {selectedProperty.city}
                  </div>
                </div>

                {selectedProperty.investmentScore && (
                  <div className="rounded-2xl bg-zinc-950 px-5 py-4 text-white">
                    <p className="text-xs uppercase tracking-widest text-zinc-400">
                      Investment score
                    </p>
                    <p className="mt-1 text-3xl font-bold">
                      {selectedProperty.investmentScore}/10
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-zinc-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                    Property type
                  </p>
                  <p className="mt-1 font-semibold capitalize">
                    {selectedProperty.propertyType}
                  </p>
                </div>

                <div className="rounded-2xl bg-zinc-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                    Area
                  </p>
                  <p className="mt-1 font-semibold">
                    {selectedProperty.area
                      ? `${selectedProperty.area.toLocaleString()} ${selectedProperty.areaUnit}`
                      : "Not specified"}
                  </p>
                </div>

                <div className="rounded-2xl bg-zinc-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                    Listing source
                  </p>
                  <p className="mt-1 font-semibold capitalize">
                    {selectedProperty.source}
                  </p>
                </div>
              </div>

              {selectedProperty.description && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold">
                    About this property
                  </h3>

                  <p className="mt-2 leading-7 text-zinc-500">
                    {selectedProperty.description}
                  </p>
                </div>
              )}

              {/* LISTED BY SECTION */}
              {selectedProperty.source === "geb" && (
                <div className="mt-8 pt-6 border-t border-zinc-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Listed By
                  </p>
                  <div className="mt-3 flex items-center justify-between bg-zinc-50 border border-black/5 p-4 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 text-white text-xs font-bold">
                        {selectedProperty.seller?.full_name?.charAt(0).toUpperCase() || "V"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900">
                          {selectedProperty.seller?.full_name || "Verified Seller"}
                        </p>
                        <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
                          ✓ Verified Seller
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleContactSeller(selectedProperty.id)}
                      disabled={contactLoading}
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold transition shadow-sm disabled:opacity-50"
                    >
                      {contactLoading ? (
                        <>
                          <Loader2 className="animate-spin" size={13} />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <MessageSquare size={13} />
                          Contact Seller
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {selectedProperty.sourceUrl && (
                  <a
                    href={selectedProperty.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 py-3 font-semibold text-white transition hover:bg-zinc-800"
                  >
                    View original listing
                    <ArrowRight size={17} />
                  </a>
                )}

                {selectedProperty.source === "geb" && (
                  <button
                    onClick={() => handleContactSeller(selectedProperty.id)}
                    disabled={contactLoading}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {contactLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={17} />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <MessageSquare size={17} />
                        Contact Seller
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={() => setSelectedProperty(null)}
                  className="rounded-full border border-zinc-200 px-6 py-3 font-semibold transition hover:bg-zinc-50"
                >
                  Close
                </button>
              </div>

              {contactError && (
                <div className="mt-4 text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 text-center">
                  {contactError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Persistent Floating AI Chatbot Trigger */}
      <button
        type="button"
        onClick={() => setAiOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-extrabold text-xs shadow-2xl shadow-sky-600/40 hover:scale-105 transition-all cursor-pointer border border-white/40"
      >
        <Sparkles className="w-4 h-4 text-amber-300" />
        <span>Ask GEB AI</span>
      </button>
      </div>
    </main>
  );
}
