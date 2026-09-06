"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import DealerCard, { DealerProfile } from "@/components/dealers/DealerCard";
import { Search, MapPin, Filter, HardHat, Sparkles, X, Calendar, DollarSign, Building, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";

export default function DealerMarketplacePage() {
  const { user, session: authSession, updateRoles } = useAuth();
  const router = useRouter();

  const [dealers, setDealers] = useState<DealerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("All");
  const [specFilter, setSpecFilter] = useState("All");
  const [minExpFilter, setMinExpFilter] = useState(0);

  // Dealer Registration/Profile Edit state
  const [regModalOpen, setRegModalOpen] = useState(false);
  const [myDealerProfile, setMyDealerProfile] = useState<DealerProfile | null>(null);
  const [regFullName, setRegFullName] = useState("");
  const [regCompanyName, setRegCompanyName] = useState("");
  const [regSpecialization, setRegSpecialization] = useState("Civil Engineering & Structural Construction");
  const [regExperienceYears, setRegExperienceYears] = useState("5");
  const [regCity, setRegCity] = useState("Lucknow");
  const [regLocality, setRegLocality] = useState("Gomti Nagar");
  const [regHourlyRate, setRegHourlyRate] = useState("1800");
  const [regBio, setRegBio] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regSkills, setRegSkills] = useState("Structural RCC, Foundation Engineering, Site Inspection");
  const [regAvatarUrl, setRegAvatarUrl] = useState("https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80");
  const [submittingReg, setSubmittingReg] = useState(false);
  const [regError, setRegError] = useState("");

  // Hiring Modal State
  const [selectedDealer, setSelectedDealer] = useState<DealerProfile | null>(null);
  const [hiringModalOpen, setHiringModalOpen] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectType, setProjectType] = useState("construction");
  const [totalBudget, setTotalBudget] = useState("4500000");
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().split("T")[0];
  });
  const [projectCity, setProjectCity] = useState("Lucknow");
  const [locality, setLocality] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [hireSuccess, setHireSuccess] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  // Meeting schedule state for hiring modal
  const [meetingDate, setMeetingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  });
  const [meetingTime, setMeetingTime] = useState("10:30 AM");
  const [initialMessage, setInitialMessage] = useState("");
  const [confirmedMeeting, setConfirmedMeeting] = useState<{ date: string; time: string; botResponse?: string } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  // Fetch dealers from API
  const fetchDealers = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (cityFilter !== "All") queryParams.append("city", cityFilter);
      if (specFilter !== "All") queryParams.append("specialization", specFilter);
      if (minExpFilter > 0) queryParams.append("min_experience", minExpFilter.toString());
      if (searchQuery.trim()) queryParams.append("search", searchQuery.trim());

      const res = await fetch(`${API_URL}/api/dealers?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDealers(data.dealers || []);
      }
    } catch (err) {
      console.error("Error fetching dealers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDealers();
  }, [cityFilter, specFilter, minExpFilter, searchQuery, API_URL]);

  // Fetch my dealer profile if user logged in
  useEffect(() => {
    if (!user) return;
    async function loadMyProfile() {
      try {
        const token = authSession?.access_token || "";
        const res = await fetch(`${API_URL}/api/dealers/me`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (data.dealer) {
            setMyDealerProfile(data.dealer);
            setRegFullName(data.dealer.full_name || "");
            setRegCompanyName(data.dealer.company_name || "");
            setRegSpecialization(data.dealer.specialization || "Civil Engineering & Structural Construction");
            setRegExperienceYears((data.dealer.experience_years || 5).toString());
            setRegCity(data.dealer.city || "Lucknow");
            setRegLocality(data.dealer.locality || "");
            setRegHourlyRate((data.dealer.hourly_rate || 1800).toString());
            setRegBio(data.dealer.bio || "");
            setRegPhone(data.dealer.phone || "");
            setRegEmail(data.dealer.email || "");
            setRegSkills((data.dealer.skills || []).join(", "));
            setRegAvatarUrl(data.dealer.avatar_url || "");
          }
        }
      } catch (err) {
        console.error("Error fetching user dealer profile:", err);
      }
    }
    loadMyProfile();
  }, [user, API_URL]);

  function handleOpenHireModal(dealer: DealerProfile) {
    setSelectedDealer(dealer);
    setProjectTitle(`New ${dealer.specialization} Project`);
    setProjectCity(dealer.city);
    setLocality(dealer.locality || "");
    setInitialMessage(`Hi ${dealer.full_name}, I am interested in hiring your team for site planning and construction. Let's confirm our initial meeting.`);
    setFormError("");
    setHireSuccess(false);
    setConfirmedMeeting(null);
    setHiringModalOpen(true);
  }

  function handleOpenRegisterModal() {
    if (!user) {
      router.push("/login");
      return;
    }
    setRegError("");
    setRegModalOpen(true);
  }

  async function handleSaveDealerProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!regFullName.trim() || !regSpecialization.trim() || !regCity.trim()) {
      setRegError("Please fill out your Name, Specialization, and City.");
      return;
    }

    setSubmittingReg(true);
    setRegError("");

    try {
      const token = authSession?.access_token || "";

      const skillsArray = regSkills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const res = await fetch(`${API_URL}/api/dealers/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          full_name: regFullName,
          company_name: regCompanyName,
          specialization: regSpecialization,
          experience_years: Number(regExperienceYears) || 1,
          city: regCity,
          locality: regLocality,
          hourly_rate: Number(regHourlyRate) || 1500,
          bio: regBio,
          phone: regPhone || user.email || "",
          email: regEmail || user.email || "",
          avatar_url: regAvatarUrl || "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80",
          skills: skillsArray,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMyDealerProfile(data.dealer);
        if (updateRoles) {
          updateRoles(["dealer", "engineer"]);
        }
        setRegModalOpen(false);
        fetchDealers();
      } else {
        const errData = await res.json();
        setRegError(errData.detail || "Failed to save profile. Please try again.");
      }
    } catch (err) {
      console.error("Error saving dealer profile:", err);
      setRegError("Server connection error. Please try again.");
    } finally {
      setSubmittingReg(false);
    }
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }
    if (!selectedDealer) return;
    if (!projectTitle.trim() || !totalBudget || Number(totalBudget) <= 0 || !targetDate) {
      setFormError("Please fill out all required fields with a valid budget.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const token = authSession?.access_token || "";

      const res = await fetch(`${API_URL}/api/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          dealer_id: selectedDealer.id,
          title: projectTitle,
          project_type: projectType,
          total_budget: Number(totalBudget),
          target_completion_date: targetDate,
          city: projectCity,
          locality: locality,
          description: description,
          preferred_meeting_date: meetingDate,
          preferred_meeting_time: meetingTime,
          initial_message: initialMessage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setHireSuccess(true);
        setCreatedProjectId(data.project?.id || null);
        setConfirmedMeeting({
          date: meetingDate,
          time: meetingTime,
          botResponse: data.project?.scheduled_meeting?.bot_response,
        });
      } else {
        const errData = await res.json();
        setFormError(errData.detail || "Failed to create project. Please try again.");
      }
    } catch (err) {
      console.error("Error creating project:", err);
      setFormError("Server connection error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner / Hero Section */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[var(--ink)] via-[var(--copper-950)] to-[var(--copper-900)] p-8 sm:p-12 text-white overflow-hidden shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-[var(--copper-500)]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--copper-500)]/20 border border-[var(--copper-400)]/30 text-[var(--copper-300)] text-xs font-bold uppercase tracking-wider">
              <HardHat className="w-4 h-4 text-[var(--copper-400)]" />
              <span>GEB V3 Dealer & Construction Network</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Hire Verified Dealers & Civil Engineers
            </h1>
            <p className="text-sm text-stone-300 leading-relaxed">
              Connect directly with top-rated general contractors, structural engineers, and renovation specialists.
              Hire with automated GEB AI Project Monitoring, milestone progress tracking, and budget safety alerts.
            </p>
          </div>

          <div className="relative z-10 shrink-0">
            <button
              type="button"
              onClick={() => router.push("/dealers/onboarding")}
              className="px-6 py-3.5 rounded-2xl bg-[var(--copper-500)] hover:bg-[var(--copper-600)] text-white text-xs font-extrabold transition-all shadow-xl flex items-center gap-2 cursor-pointer border border-white/20 hover:scale-105"
            >
              <HardHat className="w-4 h-4" />
              <span>{myDealerProfile ? "Edit My Dealer / Engineer Profile" : "List Yourself as Dealer / Engineer"}</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-[var(--paper-raised)] p-5 rounded-3xl border border-[var(--stone-line)] shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dealers by name, degree, firm, skill, or keyword..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[var(--paper)] border border-[var(--stone-line)] text-xs font-semibold focus:outline-none focus:border-[var(--copper-600)] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-soft)] hover:text-[var(--ink)]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* City Dropdown */}
            <div className="w-full md:w-48">
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--paper)] border border-[var(--stone-line)] text-xs font-bold focus:outline-none focus:border-[var(--copper-600)]"
              >
                <option value="All">All Locations</option>
                <option value="Lucknow">Lucknow</option>
                <option value="Delhi NCR">Delhi NCR</option>
                <option value="Bangalore">Bangalore</option>
              </select>
            </div>

            {/* Specialization Filter */}
            <div className="w-full md:w-56">
              <select
                value={specFilter}
                onChange={(e) => setSpecFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--paper)] border border-[var(--stone-line)] text-xs font-bold focus:outline-none focus:border-[var(--copper-600)]"
              >
                <option value="All">All Specializations</option>
                <option value="Civil Engineering & Structural Construction">Civil Engineering</option>
                <option value="Geo-Technical Soil Testing">Soil & Foundation</option>
                <option value="Architectural CAD & Master Planning">Architecture & CAD</option>
                <option value="Turnkey Contracting">Turnkey Construction</option>
              </select>
            </div>

            {/* Experience Filter */}
            <div className="w-full md:w-48">
              <select
                value={minExpFilter}
                onChange={(e) => setMinExpFilter(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--paper)] border border-[var(--stone-line)] text-xs font-bold focus:outline-none focus:border-[var(--copper-600)]"
              >
                <option value={0}>Any Experience</option>
                <option value={5}>5+ Years Exp</option>
                <option value={10}>10+ Years Exp</option>
                <option value={15}>15+ Years Exp</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dealer Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[var(--ink)] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[var(--copper-600)]" />
              <span>Available Dealers & Civil Engineers</span>
            </h2>
            <span className="text-xs font-semibold text-[var(--ink-soft)] bg-[var(--paper-raised)] border border-[var(--stone-line)] px-3 py-1 rounded-full">
              {dealers.length} Listed Professionals
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-[var(--paper-raised)] rounded-3xl border border-[var(--stone-line)]">
              <div className="w-10 h-10 border-4 border-[var(--copper-600)] border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-xs font-bold text-[var(--ink-soft)]">Loading verified dealers...</p>
            </div>
          ) : dealers.length === 0 ? (
            <div className="bg-[var(--paper-raised)] p-12 rounded-3xl border border-[var(--stone-line)] text-center space-y-3">
              <HardHat className="w-12 h-12 text-[var(--copper-400)] mx-auto opacity-50" />
              <h3 className="font-extrabold text-base text-[var(--ink)]">No Dealers Found</h3>
              <p className="text-xs text-[var(--ink-soft)] max-w-sm mx-auto">
                No matching dealers or engineers match your selected filters. Try broadening your location or specialization filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCityFilter("All");
                  setSpecFilter("All");
                  setMinExpFilter(0);
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-[var(--copper-600)] text-white text-xs font-bold"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dealers.map((dealer) => (
                <DealerCard key={dealer.id} dealer={dealer} onHire={handleOpenHireModal} onConnect={handleOpenHireModal} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Dealer Profile Registration / Edit Modal */}
      {regModalOpen && (
        <div className="fixed inset-0 z-[9999999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--paper-raised)] rounded-3xl border border-[var(--stone-line)] w-full max-w-2xl overflow-hidden shadow-2xl p-6 space-y-5 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setRegModalOpen(false)}
              className="absolute top-5 right-5 text-[var(--ink-soft)] hover:text-[var(--ink)] p-1.5 rounded-full hover:bg-[var(--paper)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-[var(--stone-line)] pb-3">
              <h3 className="font-extrabold text-lg text-[var(--ink)] flex items-center gap-2">
                <HardHat className="w-5 h-5 text-[var(--copper-600)]" />
                <span>{myDealerProfile ? "Edit Dealer / Engineer Marketplace Profile" : "List Yourself as Dealer / Engineer"}</span>
              </h3>
              <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                Fill in your engineering qualifications, description, pricing rates, and contact details to get listed in the GEB Marketplace.
              </p>
            </div>

            {regError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            <form onSubmit={handleSaveDealerProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[var(--ink)] mb-1">Full Name / Engineer Name *</label>
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="e.g. Er. Rajesh Verma"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--stone-line)] font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[var(--ink)] mb-1">Firm / Company Name</label>
                  <input
                    type="text"
                    value={regCompanyName}
                    onChange={(e) => setRegCompanyName(e.target.value)}
                    placeholder="e.g. Verma Structural & Construction Studio"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--stone-line)] font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-[var(--ink)] mb-1">Specialization *</label>
                  <select
                    value={regSpecialization}
                    onChange={(e) => setRegSpecialization(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--stone-line)] font-bold"
                  >
                    <option value="Civil Engineering & Structural Construction">Civil Engineering & Structural</option>
                    <option value="Turnkey Residential Renovation">Turnkey Renovation</option>
                    <option value="Plot & Land Development">Plot & Land Development</option>
                    <option value="Eco-Friendly Construction">Eco-Friendly Construction</option>
                    <option value="Architectural & Interior Design">Architectural & Interior Design</option>
                    <option value="Land Surveying & Geotechnical">Land Surveying & Geotechnical</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[var(--ink)] mb-1">Experience (Years) *</label>
                  <input
                    type="number"
                    value={regExperienceYears}
                    onChange={(e) => setRegExperienceYears(e.target.value)}
                    required
                    min={1}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--stone-line)] font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[var(--ink)] mb-1">Hourly Rate / Pricing (₹) *</label>
                  <input
                    type="number"
                    value={regHourlyRate}
                    onChange={(e) => setRegHourlyRate(e.target.value)}
                    placeholder="1800"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--stone-line)] font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[var(--ink)] mb-1">City Location *</label>
                  <input
                    type="text"
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    placeholder="e.g. Lucknow"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--stone-line)] font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[var(--ink)] mb-1">Locality / Sector</label>
                  <input
                    type="text"
                    value={regLocality}
                    onChange={(e) => setRegLocality(e.target.value)}
                    placeholder="e.g. Gomti Nagar"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--stone-line)] font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[var(--ink)] mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--stone-line)] font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[var(--ink)] mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="engineer@domain.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--stone-line)] font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[var(--ink)] mb-1">Skills & Badges (Comma-separated)</label>
                <input
                  type="text"
                  value={regSkills}
                  onChange={(e) => setRegSkills(e.target.value)}
                  placeholder="Structural RCC, Soil Testing, AutoCAD, Vastu Compliant"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--stone-line)] font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--ink)] mb-1">Bio & Service Description</label>
                <textarea
                  value={regBio}
                  onChange={(e) => setRegBio(e.target.value)}
                  rows={3}
                  placeholder="Describe your engineering services, past projects, specialization, and execution standards..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--stone-line)] font-semibold"
                />
              </div>

              <div className="pt-3 border-t border-[var(--stone-line)] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRegModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[var(--stone-line)] text-xs font-bold text-[var(--ink-soft)] hover:bg-[var(--paper)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReg}
                  className="px-6 py-2.5 rounded-xl bg-[var(--copper-600)] hover:bg-[var(--copper-700)] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submittingReg ? "Saving Profile..." : "Save & List in Marketplace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hiring & Project Creation Modal */}
      {hiringModalOpen && selectedDealer && (
        <div className="fixed inset-0 z-[9999999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--paper-raised)] rounded-3xl border border-[var(--stone-line)] w-full max-w-xl overflow-hidden shadow-2xl p-6 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setHiringModalOpen(false)}
              className="absolute top-5 right-5 text-[var(--ink-soft)] hover:text-[var(--ink)] p-1.5 rounded-full hover:bg-[var(--paper)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {hireSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-[var(--ink)]">Project Created & Meeting Scheduled!</h3>
                  <p className="text-xs text-[var(--ink-soft)]">
                    You have hired <span className="font-bold text-[var(--ink)]">{selectedDealer.full_name}</span> for &quot;{projectTitle}&quot;.
                  </p>
                </div>

                {confirmedMeeting && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-left text-xs space-y-2 text-emerald-900">
                    <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <span>Meeting Fixed by Dealer CRM Bot</span>
                    </p>
                    <p className="font-semibold text-[11px] text-emerald-700">
                      Date: <span className="font-bold">{confirmedMeeting.date}</span> at <span className="font-bold">{confirmedMeeting.time}</span>
                    </p>
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left text-xs space-y-2 text-amber-900">
                  <p className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>GEB AI Monitoring Activated</span>
                  </p>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    Your milestones, deadline tracking, expense logs, and AI risk reports are live in your Buyer Dashboard.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => router.push("/buyer-dashboard?tab=projects")}
                    className="flex-1 py-3 rounded-2xl bg-[var(--copper-600)] hover:bg-[var(--copper-700)] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <span>View Project in Buyer Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateProject} className="space-y-5">
                <div className="flex items-center gap-3 border-b border-[var(--stone-line)] pb-4">
                  <img
                    src={selectedDealer.avatar_url || "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80"}
                    alt={selectedDealer.full_name}
                    className="w-12 h-12 rounded-xl object-cover border border-[var(--stone-line)]"
                  />
                  <div>
                    <h3 className="font-extrabold text-base text-[var(--ink)]">Hire {selectedDealer.full_name}</h3>
                    <p className="text-xs font-semibold text-[var(--copper-700)]">{selectedDealer.specialization} • ₹{selectedDealer.hourly_rate?.toLocaleString()}/hr</p>
                  </div>
                </div>

                {formError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-[var(--ink)] mb-1">Project Title *</label>
                    <input
                      type="text"
                      value={projectTitle}
                      onChange={(e) => setProjectTitle(e.target.value)}
                      placeholder="e.g. 3BHK Luxury Villa Construction"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--stone-line)] font-semibold focus:outline-none focus:border-[var(--copper-600)]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-[var(--ink)] mb-1">Project Type</label>
                      <select
                        value={projectType}
                        onChange={(e) => setProjectType(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--stone-line)] font-bold focus:outline-none focus:border-[var(--copper-600)]"
                      >
                        <option value="construction">Full Construction</option>
                        <option value="renovation">Turnkey Renovation</option>
                        <option value="interior">Interior Structural Work</option>
                        <option value="structural">Foundation & Boundary</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-[var(--ink)] mb-1">Total Budget (₹) *</label>
                      <input
                        type="number"
                        value={totalBudget}
                        onChange={(e) => setTotalBudget(e.target.value)}
                        placeholder="4500000"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--stone-line)] font-semibold focus:outline-none focus:border-[var(--copper-600)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-[var(--ink)] mb-1">Target Completion Date *</label>
                      <input
                        type="date"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--stone-line)] font-semibold focus:outline-none focus:border-[var(--copper-600)]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[var(--ink)] mb-1">Location / City</label>
                      <input
                        type="text"
                        value={projectCity}
                        onChange={(e) => setProjectCity(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--stone-line)] font-semibold focus:outline-none focus:border-[var(--copper-600)]"
                      />
                    </div>
                  </div>

                  {/* Consultation Meeting Request section */}
                  <div className="p-4 rounded-2xl bg-[var(--paper)] border border-[var(--stone-line)] space-y-3">
                    <p className="font-bold text-[var(--ink)] flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[var(--copper-600)]" />
                      <span>Request Initial Consultation Meeting (Dealer CRM Bot)</span>
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[var(--ink-soft)] mb-1">Preferred Date</label>
                        <input
                          type="date"
                          value={meetingDate}
                          onChange={(e) => setMeetingDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[var(--paper-raised)] border border-[var(--stone-line)] font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[var(--ink-soft)] mb-1">Preferred Time</label>
                        <select
                          value={meetingTime}
                          onChange={(e) => setMeetingTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[var(--paper-raised)] border border-[var(--stone-line)] font-semibold"
                        >
                          <option value="09:30 AM">09:30 AM</option>
                          <option value="10:30 AM">10:30 AM</option>
                          <option value="02:00 PM">02:00 PM</option>
                          <option value="04:30 PM">04:30 PM</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[var(--ink)] mb-1">Project Scope & Initial Message to Dealer</label>
                    <textarea
                      value={initialMessage}
                      onChange={(e) => setInitialMessage(e.target.value)}
                      rows={3}
                      placeholder="Specify key requirements, site condition, or details for the initial meeting..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--stone-line)] font-semibold focus:outline-none focus:border-[var(--copper-600)]"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--stone-line)] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setHiringModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-[var(--stone-line)] text-xs font-bold text-[var(--ink-soft)] hover:bg-[var(--paper)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-[var(--copper-600)] hover:bg-[var(--copper-700)] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Sending Request..." : "Request to Hire & Fix Meeting"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
