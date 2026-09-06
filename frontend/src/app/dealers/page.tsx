"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import DealerCard, { DealerProfile } from "@/components/dealers/DealerCard";
import { Search, MapPin, Filter, HardHat, Sparkles, X, Calendar, DollarSign, Building, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getApiUrl } from "@/lib/api";

const DEFAULT_FALLBACK_DEALERS: DealerProfile[] = [
  {
    id: "dlr_1",
    full_name: "Er. Vikramaditya Verma",
    company_name: "Apex Structural & Civil BuildTech",
    degree: "M.Tech Structural Engineering",
    specialization: "Civil Engineering & Structural Construction",
    experience_years: 14,
    rating: 4.9,
    completed_projects: 38,
    city: "Lucknow",
    locality: "Gomti Nagar",
    hourly_rate: 2200,
    bio: "Specialized in RCC frame structures, heavy plot foundations, and luxury residential villas in Uttar Pradesh.",
    phone: "+91 98765 43210",
    email: "vikram@apexbuild.in",
    avatar_url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80",
    skills: ["Structural RCC", "Foundation Engineering", "Soil Stabilization", "AutoCAD Architecture"],
    work_capabilities: ["Structural RCC", "Foundation Engineering", "Soil Stabilization", "AutoCAD Architecture"],
    is_verified: true,
  },
  {
    id: "dlr_2",
    full_name: "Er. Priya Sharma",
    company_name: "Urban Space Renovation Studio",
    degree: "B.Tech Civil Engineering",
    specialization: "Turnkey Residential Renovation & Interior Works",
    experience_years: 9,
    rating: 4.8,
    completed_projects: 26,
    city: "Lucknow",
    locality: "Hazratganj",
    hourly_rate: 1800,
    bio: "Award-winning civil engineer specializing in complete home transformations, structural alterations, and high-end interiors.",
    phone: "+91 98123 45678",
    email: "priya@urbanspace.in",
    avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    skills: ["Interior Renovation", "Electrical & Plumbing", "3D Elevation", "Material Quality Control"],
    work_capabilities: ["Interior Renovation", "Electrical & Plumbing", "3D Elevation", "Material Quality Control"],
    is_verified: true,
  },
  {
    id: "dlr_3",
    full_name: "Rajesh Kumar Soni",
    company_name: "Soni Builders & Infrastructure",
    degree: "Diploma in Civil & Surveying",
    specialization: "Plot Land Development & Boundary Infrastructure",
    experience_years: 18,
    rating: 4.7,
    completed_projects: 62,
    city: "Delhi NCR",
    locality: "Noida Sector 62",
    hourly_rate: 2500,
    bio: "Expert contractor in boundary walls, land leveling, drainage networks, and commercial structure erection.",
    phone: "+91 99887 76655",
    email: "rajesh@sonibuilders.com",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    skills: ["Land Leveling", "Retaining Walls", "Drainage Infra", "Heavy Machinery Management"],
    work_capabilities: ["Land Leveling", "Retaining Walls", "Drainage Infra", "Heavy Machinery Management"],
    is_verified: true,
  },
  {
    id: "dlr_4",
    full_name: "Ananya Roy",
    company_name: "GreenTerra Sustainable Engineering",
    degree: "B.Arch & M.Tech Environmental Civil",
    specialization: "Eco-Friendly Construction & Solar Modular Homes",
    experience_years: 7,
    rating: 5.0,
    completed_projects: 19,
    city: "Bangalore",
    locality: "Indiranagar",
    hourly_rate: 2100,
    bio: "Specialized in sustainable building materials, rainwater harvesting integration, and smart green energy homes.",
    phone: "+91 97766 55443",
    email: "ananya@greenterra.io",
    avatar_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80",
    skills: ["Green Building", "Solar Power Grid Setup", "Thermal Insulation", "Prefabricated Structures"],
    work_capabilities: ["Green Building", "Solar Power Grid Setup", "Thermal Insulation", "Prefabricated Structures"],
    is_verified: true,
  },
];


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

  const API_URL = getApiUrl();

  // Fetch dealers from API with direct Supabase & local storage fallbacks
  const fetchDealers = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (cityFilter !== "All") queryParams.append("city", cityFilter);
      if (specFilter !== "All") queryParams.append("specialization", specFilter);
      if (minExpFilter > 0) queryParams.append("min_experience", minExpFilter.toString());
      if (searchQuery.trim()) queryParams.append("search", searchQuery.trim());

      let fetchedList: DealerProfile[] = [];
      let apiSuccess = false;

      // 1. Primary API fetch
      try {
        const res = await fetch(`${API_URL}/api/dealers?${queryParams.toString()}`);
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            if (data.dealers && Array.isArray(data.dealers) && data.dealers.length > 0) {
              fetchedList = data.dealers;
              apiSuccess = true;
            }
          }
        }
      } catch (e) {
        console.warn("Primary API fetch notice, checking fallbacks:", e);
      }

      // Secondary API fallback if localhost alternate port
      if (!apiSuccess) {
        try {
          const fallbackHost = API_URL.includes("127.0.0.1")
            ? "http://localhost:8000"
            : "http://127.0.0.1:8000";
          const res2 = await fetch(`${fallbackHost}/api/dealers?${queryParams.toString()}`);
          if (res2.ok) {
            const contentType = res2.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const data2 = await res2.json();
              if (data2.dealers && Array.isArray(data2.dealers) && data2.dealers.length > 0) {
                fetchedList = data2.dealers;
                apiSuccess = true;
              }
            }
          }
        } catch (e2) {
          console.warn("Secondary fallback fetch notice:", e2);
        }
      }

      // 2. Direct Supabase Fallback (if backend API is unreachable or returned empty)
      if (!apiSuccess || fetchedList.length === 0) {
        try {
          const { data: sbData, error: sbError } = await supabase.from("dealer_profiles").select("*");
          if (!sbError && sbData && sbData.length > 0) {
            const mappedSb: DealerProfile[] = sbData.map((d: any) => ({
              id: d.id,
              user_id: d.user_id,
              full_name: d.full_name || "Verified Dealer",
              company_name: d.company_name || "",
              degree: d.degree || "B.Tech Civil Engineering",
              specialization: d.specialization || "Civil Engineering & Structural Construction",
              experience_years: d.experience_years || 5,
              rating: d.rating || 5.0,
              completed_projects: d.completed_projects || 1,
              city: d.city || "Lucknow",
              locality: d.locality || "Gomti Nagar",
              hourly_rate: d.hourly_rate || 1800,
              bio: d.bio || "",
              phone: d.phone || "",
              email: d.email || "",
              avatar_url: d.avatar_url || "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80",
              skills: Array.isArray(d.skills) ? d.skills : [],
              work_capabilities: Array.isArray(d.skills) ? d.skills : [],
              is_verified: true,
            }));
            fetchedList = mappedSb;
          }
        } catch (sbErr) {
          console.warn("Supabase direct query notice:", sbErr);
        }
      }

      // 3. Merge Default Fallback Dealers if list is still small/empty
      const mergedMap = new Map<string, DealerProfile>();
      for (const d of fetchedList) {
        mergedMap.set(d.id || d.full_name, d);
      }
      for (const fallbackD of DEFAULT_FALLBACK_DEALERS) {
        if (!mergedMap.has(fallbackD.id)) {
          mergedMap.set(fallbackD.id, fallbackD);
        }
      }

      // 4. Merge My Local Profile (Rishi or logged-in user profile)
      let localProfile: DealerProfile | null = myDealerProfile;
      if (!localProfile) {
        try {
          const s = localStorage.getItem("geb_my_dealer_profile");
          if (s) localProfile = JSON.parse(s);
        } catch (e) {}
      }
      if (localProfile && localProfile.full_name) {
        const key = localProfile.id || localProfile.full_name;
        mergedMap.set(key, { ...localProfile, is_verified: true });
      }

      let combinedList = Array.from(mergedMap.values());

      // 5. Client side filter application for non-API fallbacks
      if (cityFilter !== "All") {
        combinedList = combinedList.filter((d) => d.city?.toLowerCase().includes(cityFilter.toLowerCase()));
      }
      if (specFilter !== "All") {
        const specLower = specFilter.toLowerCase();
        const keyTerms = ["civil", "soil", "cad", "turnkey", "plot", "eco", "arch"].filter((t) => specLower.includes(t));
        if (keyTerms.length > 0) {
          combinedList = combinedList.filter((d) => keyTerms.some((kt) => d.specialization?.toLowerCase().includes(kt)));
        } else {
          combinedList = combinedList.filter((d) => d.specialization?.toLowerCase().includes(specLower));
        }
      }
      if (minExpFilter > 0) {
        combinedList = combinedList.filter((d) => (d.experience_years || 0) >= minExpFilter);
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        combinedList = combinedList.filter(
          (d) =>
            d.full_name?.toLowerCase().includes(q) ||
            d.company_name?.toLowerCase().includes(q) ||
            d.specialization?.toLowerCase().includes(q) ||
            d.bio?.toLowerCase().includes(q) ||
            (d.skills && d.skills.some((s) => s.toLowerCase().includes(q)))
        );
      }

      setDealers(combinedList);
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
    async function loadMyProfile() {
      try {
        // Read local storage first for instant feedback
        const savedLocal = localStorage.getItem("geb_my_dealer_profile");
        if (savedLocal) {
          try {
            const parsed = JSON.parse(savedLocal);
            if (parsed && parsed.full_name) {
              setMyDealerProfile(parsed);
              populateRegForm(parsed);
            }
          } catch (e) {}
        }

        if (!user) return;

        let fetchedProfile: DealerProfile | null = null;

        // Try API
        try {
          const token = authSession?.access_token || "";
          const res = await fetch(`${API_URL}/api/dealers/me`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (res.ok) {
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const data = await res.json();
              if (data.dealer) {
                fetchedProfile = data.dealer;
              }
            }
          }
        } catch (e) {
          console.warn("API /api/dealers/me notice, falling back to direct Supabase query:", e);
        }

        // Direct Supabase query fallback for user profile
        if (!fetchedProfile) {
          try {
            const { data: sbProfiles } = await supabase
              .from("dealer_profiles")
              .select("*")
              .or(`user_id.eq.${user.id},email.eq.${user.email}`);

            if (sbProfiles && sbProfiles.length > 0) {
              const d = sbProfiles[0];
              fetchedProfile = {
                id: d.id,
                user_id: d.user_id,
                full_name: d.full_name,
                company_name: d.company_name || "",
                degree: d.degree || "B.Tech Civil Engineering",
                specialization: d.specialization || "Civil Engineering & Structural Construction",
                experience_years: d.experience_years || 5,
                rating: d.rating || 5.0,
                completed_projects: d.completed_projects || 1,
                city: d.city || "Lucknow",
                locality: d.locality || "",
                hourly_rate: d.hourly_rate || 1800,
                bio: d.bio || "",
                phone: d.phone || "",
                email: d.email || user.email || "",
                avatar_url: d.avatar_url || "",
                skills: Array.isArray(d.skills) ? d.skills : [],
                work_capabilities: Array.isArray(d.skills) ? d.skills : [],
                is_verified: true,
              };
            }
          } catch (sbErr) {
            console.warn("Supabase my_profile notice:", sbErr);
          }
        }

        if (fetchedProfile) {
          setMyDealerProfile(fetchedProfile);
          populateRegForm(fetchedProfile);
          try {
            localStorage.setItem("geb_my_dealer_profile", JSON.stringify(fetchedProfile));
          } catch (e) {}
        }
      } catch (err) {
        console.error("Error fetching user dealer profile:", err);
      }
    }

    function populateRegForm(parsed: DealerProfile) {
      setRegFullName(parsed.full_name || "");
      setRegCompanyName(parsed.company_name || "");
      setRegSpecialization(parsed.specialization || "Civil Engineering & Structural Construction");
      setRegExperienceYears((parsed.experience_years || 5).toString());
      setRegCity(parsed.city || "Lucknow");
      setRegLocality(parsed.locality || "");
      setRegHourlyRate((parsed.hourly_rate || 1800).toString());
      setRegBio(parsed.bio || "");
      setRegPhone(parsed.phone || "");
      setRegEmail(parsed.email || "");
      setRegSkills(Array.isArray(parsed.skills) ? parsed.skills.join(", ") : "");
      setRegAvatarUrl(parsed.avatar_url || "");
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

      const fullProfile: DealerProfile = {
        id: myDealerProfile?.id || String(Date.now()),
        user_id: user.id,
        full_name: regFullName,
        company_name: regCompanyName,
        specialization: regSpecialization,
        experience_years: Number(regExperienceYears) || 1,
        rating: myDealerProfile?.rating || 5.0,
        completed_projects: myDealerProfile?.completed_projects || 1,
        city: regCity,
        locality: regLocality,
        hourly_rate: Number(regHourlyRate) || 1500,
        bio: regBio,
        phone: regPhone || user.email || "",
        email: regEmail || user.email || "",
        avatar_url: regAvatarUrl || "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80",
        skills: skillsArray,
        work_capabilities: skillsArray,
        is_verified: true,
      };

      // Always save to localStorage & Supabase directly as robust dual layer
      try {
        localStorage.setItem("geb_my_dealer_profile", JSON.stringify(fullProfile));
      } catch (e) {}

      try {
        await supabase.from("dealer_profiles").upsert({
          id: fullProfile.id.includes("-") ? fullProfile.id : undefined,
          user_id: user.id,
          full_name: fullProfile.full_name,
          company_name: fullProfile.company_name,
          specialization: fullProfile.specialization,
          experience_years: fullProfile.experience_years,
          rating: 5.0,
          completed_projects: 1,
          city: fullProfile.city,
          locality: fullProfile.locality,
          hourly_rate: fullProfile.hourly_rate,
          bio: fullProfile.bio,
          phone: fullProfile.phone,
          email: fullProfile.email,
          avatar_url: fullProfile.avatar_url,
          skills: skillsArray,
          is_verified: true,
        });
      } catch (sbErr) {
        console.warn("Direct Supabase profile upsert notice:", sbErr);
      }

      // Try API save
      try {
        const res = await fetch(`${API_URL}/api/dealers/profile`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify(fullProfile),
        });
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            if (data.dealer) {
              setMyDealerProfile(data.dealer);
            }
          }
        }
      } catch (err) {
        console.warn("API profile save notice (saved to Supabase & localStorage):", err);
      }

      setMyDealerProfile(fullProfile);
      if (updateRoles) {
        updateRoles(["dealer", "engineer"]);
      }
      setRegModalOpen(false);
      fetchDealers();
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
