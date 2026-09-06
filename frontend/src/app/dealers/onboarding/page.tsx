"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import {
  HardHat,
  GraduationCap,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Wrench,
  FileText
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import ProfileImageUploader from "@/components/upload/ProfileImageUploader";

import { getApiUrl } from "@/lib/api";

export default function DealerOnboardingPage() {
  const { user, session, updateRoles } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [degree, setDegree] = useState("B.Tech Civil Engineering");
  const [companyName, setCompanyName] = useState("");
  const [specialization, setSpecialization] = useState("Civil Engineering & Structural Construction");
  const [experienceYears, setExperienceYears] = useState("5");
  const [city, setCity] = useState("Lucknow");
  const [locality, setLocality] = useState("Gomti Nagar");
  const [hourlyRate, setHourlyRate] = useState("1800");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [workCapabilities, setWorkCapabilities] = useState("RCC Structural Design, Foundation Engineering, Site Supervision, Quality Inspection, Permitting");
  const [avatarUrl, setAvatarUrl] = useState("https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const API_URL = getApiUrl();

  // Pre-fill user details if logged in
  useEffect(() => {
    if (!user) return;
    setFullName(user.user_metadata?.full_name || "");
    setEmail(user.email || "");

    async function fetchExistingProfile() {
      try {
        setLoading(true);
        const token = session?.access_token || "";

        const res = await fetch(`${API_URL}/api/dealers/me`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (data.dealer) {
            const d = data.dealer;
            setFullName(d.full_name || user?.user_metadata?.full_name || "");
            setDegree(d.degree || "B.Tech Civil Engineering");
            setCompanyName(d.company_name || "");
            setSpecialization(d.specialization || "Civil Engineering & Structural Construction");
            setExperienceYears((d.experience_years || 5).toString());
            setCity(d.city || "Lucknow");
            setLocality(d.locality || "");
            setHourlyRate((d.hourly_rate || 1800).toString());
            setPhone(d.phone || "");
            setEmail(d.email || user?.email || "");
            setBio(d.bio || "");
            if (Array.isArray(d.work_capabilities) && d.work_capabilities.length > 0) {
              setWorkCapabilities(d.work_capabilities.join(", "));
            } else if (Array.isArray(d.skills) && d.skills.length > 0) {
              setWorkCapabilities(d.skills.join(", "));
            }
            if (d.avatar_url) setAvatarUrl(d.avatar_url);
          }
        }
      } catch (err) {
        console.error("Error fetching existing dealer profile:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchExistingProfile();
  }, [user, session, API_URL]);

  async function handleSubmitProfile(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!fullName.trim()) {
      setError("Please provide your Full Name.");
      return;
    }
    if (!degree.trim()) {
      setError("Please state your Degree or Professional Qualification.");
      return;
    }
    if (!city.trim()) {
      setError("Please state your primary operating City.");
      return;
    }
    if (!bio.trim()) {
      setError("Please write a brief description of your work and experience.");
      return;
    }

    setSaving(true);
    try {
      const token = session?.access_token || "";

      const capsArray = workCapabilities
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const profilePayload = {
        full_name: fullName.trim(),
        company_name: companyName.trim(),
        degree: degree.trim(),
        specialization,
        experience_years: Number(experienceYears) || 1,
        city: city.trim(),
        locality: locality.trim(),
        hourly_rate: Number(hourlyRate) || 1500,
        bio: bio.trim(),
        phone: phone.trim() || user?.email || "",
        email: email.trim() || user?.email || "",
        avatar_url: avatarUrl,
        skills: capsArray,
        work_capabilities: capsArray,
      };

      const res = await fetch(`${API_URL}/api/dealers/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(profilePayload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to save profile on backend.");
      }

      // Instantly update user capabilities / roles in AuthProvider context
      if (updateRoles) {
        updateRoles(["dealer", "engineer"]);
      }

      setSuccess("Your Dealer & Engineer Profile is now registered and active on GEB! Redirecting to marketplace...");
      setTimeout(() => {
        router.push("/dealers");
      }, 700);

    } catch (err) {
      console.error("Dealer profile submission notice:", err);
      setError(err instanceof Error ? err.message : "Error saving dealer profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10">
        {/* Header card */}
        <div className="bg-gradient-to-r from-slate-900 via-[var(--ink)] to-[var(--copper-950)] text-white rounded-3xl p-8 shadow-xl relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--copper-500)]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-copper-300 text-xs font-semibold backdrop-blur-md mb-4">
              <HardHat className="w-4 h-4 text-[var(--copper-400)]" />
              <span>Dealer & Civil Engineer Onboarding</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
              List Your Engineering & Dealer Profile
            </h1>
            <p className="mt-2 text-white/80 text-sm max-w-xl">
              Upload your photo, fill in your degree, work capabilities, and experience to get listed on GEB. Land buyers and property owners will connect with you directly.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[var(--copper-600)] animate-spin" />
            <p className="mt-3 text-sm text-[var(--ink-soft)] font-medium">Loading existing profile...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmitProfile} className="bg-[var(--paper-raised)] border border-[var(--stone-line)] rounded-3xl p-6 sm:p-10 shadow-lg space-y-8">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Section 1: Photo & Basic Identity */}
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-[var(--ink)] flex items-center gap-2 border-b border-[var(--stone-line)] pb-3">
                <User className="w-5 h-5 text-[var(--copper-600)]" />
                1. Professional Photo & Basic Details
              </h2>

              {/* PROFILE PHOTO UPLOADER */}
              <ProfileImageUploader
                currentUrl={avatarUrl}
                onUploadComplete={(url) => setAvatarUrl(url)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Er. Rajesh Kumar"
                    className="w-full px-4 py-3 rounded-2xl border border-[var(--stone-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--copper-600)] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    Degree / Qualification *
                  </label>
                  <input
                    type="text"
                    required
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    placeholder="e.g. B.Tech Civil, M.Tech Structural, Licensed Builder"
                    className="w-full px-4 py-3 rounded-2xl border border-[var(--stone-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--copper-600)] focus:bg-white transition-all font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-2">
                    Company / Firm Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Apex Civil Engineers & Builders"
                    className="w-full px-4 py-3 rounded-2xl border border-[var(--stone-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--copper-600)] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-2">
                    Years of Experience *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-[var(--stone-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--copper-600)] focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Specialization & Work Capabilities */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[var(--ink)] flex items-center gap-2 border-b border-[var(--stone-line)] pb-3">
                <Briefcase className="w-5 h-5 text-[var(--copper-600)]" />
                2. Specialization & Work Capabilities
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-2">
                    Primary Specialization *
                  </label>
                  <select
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-[var(--stone-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--copper-600)] focus:bg-white transition-all font-semibold"
                  >
                    <option value="Civil Engineering & Structural Construction">Civil Engineering & Structural Construction</option>
                    <option value="Geo-Technical Soil Testing & Foundation">Geo-Technical Soil Testing & Foundation</option>
                    <option value="Architectural CAD & Master Planning">Architectural CAD & Master Planning</option>
                    <option value="Land Surveying & GPS Contour Mapping">Land Surveying & GPS Contour Mapping</option>
                    <option value="Turnkey Commercial & Residential Contracting">Turnkey Commercial & Residential Contracting</option>
                    <option value="Plot & Land Dealer Services">Plot & Land Dealer Services</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-2">
                    Hourly / Day Rate (₹) *
                  </label>
                  <input
                    type="number"
                    min="500"
                    step="100"
                    required
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-[var(--stone-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--copper-600)] focus:bg-white transition-all font-semibold text-[var(--copper-800)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Wrench className="w-4 h-4 text-[var(--copper-600)]" />
                  Work Capabilities & Services Offered (comma separated)
                </label>
                <input
                  type="text"
                  value={workCapabilities}
                  onChange={(e) => setWorkCapabilities(e.target.value)}
                  placeholder="e.g. RCC Structural Design, Soil Testing, Site Supervision, Foundation Drilling, Quality Control"
                  className="w-full px-4 py-3 rounded-2xl border border-[var(--stone-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--copper-600)] focus:bg-white transition-all"
                />
                <p className="text-[11px] text-[var(--ink-soft)] mt-1">
                  List specific tasks or engineering work clients can request from you.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-2 flex items-center gap-1">
                  <FileText className="w-4 h-4 text-[var(--copper-600)]" />
                  Detailed Work Description & Bio *
                </label>
                <textarea
                  rows={4}
                  required
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Describe your background, past engineering projects, certifications, and what work you specialize in..."
                  className="w-full px-4 py-3 rounded-2xl border border-[var(--stone-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--copper-600)] focus:bg-white transition-all leading-relaxed"
                />
              </div>
            </div>

            {/* Section 3: Location & Contact */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[var(--ink)] flex items-center gap-2 border-b border-[var(--stone-line)] pb-3">
                <MapPin className="w-5 h-5 text-[var(--copper-600)]" />
                3. Operating Location & Contact Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-2">
                    Operating City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Lucknow"
                    className="w-full px-4 py-3 rounded-2xl border border-[var(--stone-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--copper-600)] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-2">
                    Locality / Area
                  </label>
                  <input
                    type="text"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    placeholder="e.g. Gomti Nagar / Aliganj"
                    className="w-full px-4 py-3 rounded-2xl border border-[var(--stone-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--copper-600)] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[var(--copper-600)]" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-2xl border border-[var(--stone-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--copper-600)] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[var(--copper-600)]" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="engineer@example.com"
                    className="w-full px-4 py-3 rounded-2xl border border-[var(--stone-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--copper-600)] focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-4">
              <Link
                href="/dealers"
                className="px-6 py-3 rounded-2xl border border-[var(--stone-line)] text-sm font-semibold hover:bg-[var(--paper)] transition-all"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3.5 rounded-2xl bg-[var(--copper-600)] hover:bg-[var(--copper-700)] text-white font-bold text-sm transition-all shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Complete & List Profile</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
