"use client";

import { Star, MapPin, Award, CheckCircle2, Building2, Phone, Mail, ArrowRight, ShieldCheck, GraduationCap, Calendar } from "lucide-react";

export interface DealerProfile {
  id: string;
  user_id?: string;
  full_name: string;
  company_name?: string;
  degree?: string;
  specialization: string;
  experience_years: number;
  rating: number;
  completed_projects: number;
  city: string;
  locality?: string;
  hourly_rate?: number;
  bio?: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
  skills?: string[];
  work_capabilities?: string[];
  is_verified?: boolean;
}

interface DealerCardProps {
  dealer: DealerProfile;
  onHire: (dealer: DealerProfile) => void;
  onConnect?: (dealer: DealerProfile) => void;
}

export default function DealerCard({ dealer, onHire, onConnect }: DealerCardProps) {
  const capabilities = dealer.work_capabilities || dealer.skills || [];

  return (
    <div className="bg-[var(--paper-raised)] rounded-3xl border border-[var(--stone-line)] p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:border-[var(--copper-400)]">
      <div>
        {/* Header section with avatar, name & rating */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src={dealer.avatar_url || "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80"}
                alt={dealer.full_name}
                className="w-14 h-14 rounded-2xl object-cover border border-[var(--stone-line)] shadow-inner"
              />
              {dealer.is_verified && (
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow" title="GEB Verified Dealer">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-base text-[var(--ink)] group-hover:text-[var(--copper-700)] transition-colors">
                  {dealer.full_name}
                </h3>
              </div>

              {dealer.degree && (
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full mt-1">
                  <GraduationCap className="w-3 h-3 text-emerald-600" />
                  <span>{dealer.degree}</span>
                </div>
              )}

              {dealer.company_name && (
                <p className="text-xs font-semibold text-[var(--ink-soft)] flex items-center gap-1 mt-1">
                  <Building2 className="w-3 h-3 text-[var(--copper-600)]" />
                  <span>{dealer.company_name}</span>
                </p>
              )}

              <div className="flex items-center gap-2 mt-1.5">
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  {dealer.rating ? dealer.rating.toFixed(1) : "4.9"}
                </span>
                <span className="text-[11px] font-semibold text-[var(--ink-soft)]">
                  {dealer.completed_projects || 12} projects done
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs font-medium text-[var(--ink-soft)]">Rate / hr</p>
            <p className="text-base font-extrabold text-[var(--copper-700)]">
              ₹{dealer.hourly_rate?.toLocaleString() || "1,500"}
            </p>
          </div>
        </div>

        {/* Specialization Badge & Location */}
        <div className="mt-4 pt-3 border-t border-[var(--stone-line)] flex items-center justify-between text-xs">
          <span className="px-3 py-1 rounded-full bg-[var(--copper-50)] text-[var(--copper-800)] font-bold border border-[var(--copper-100)] truncate max-w-[200px]">
            {dealer.specialization}
          </span>
          <span className="flex items-center gap-1 text-[var(--ink-soft)] font-medium">
            <MapPin className="w-3.5 h-3.5 text-[var(--copper-600)]" />
            {dealer.locality ? `${dealer.locality}, ${dealer.city}` : dealer.city}
          </span>
        </div>

        {/* Bio summary */}
        {dealer.bio && (
          <p className="text-xs text-[var(--ink-soft)] mt-3 line-clamp-2 leading-relaxed italic">
            &ldquo;{dealer.bio}&rdquo;
          </p>
        )}

        {/* Work capabilities / Services pill tags */}
        {capabilities.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-1">Work Services & Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {capabilities.slice(0, 4).map((cap, idx) => (
                <span key={idx} className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[var(--paper)] text-[var(--ink)] border border-[var(--stone-line)]">
                  {cap}
                </span>
              ))}
              {capabilities.length > 4 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--paper)] text-[var(--ink-soft)]">
                  +{capabilities.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons & Contact Connect options */}
      <div className="mt-5 pt-4 border-t border-[var(--stone-line)] space-y-3">
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <div className="font-semibold text-[var(--ink-soft)] flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-[var(--copper-600)]" />
            <span>{dealer.experience_years} Yrs Exp.</span>
          </div>

          <div className="flex items-center gap-2">
            {dealer.phone && (
              <a
                href={`tel:${dealer.phone}`}
                className="p-2 rounded-xl bg-[var(--copper-50)] text-[var(--copper-700)] hover:bg-[var(--copper-100)] border border-[var(--copper-200)] transition-all flex items-center gap-1 font-bold text-[11px]"
                title="Call Dealer Directly"
              >
                <Phone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Call</span>
              </a>
            )}

            {dealer.email && (
              <a
                href={`mailto:${dealer.email}?subject=Property Inquiry via GEB`}
                className="p-2 rounded-xl bg-[var(--paper)] text-[var(--ink-soft)] hover:text-[var(--ink)] border border-[var(--stone-line)] hover:border-[var(--copper-400)] transition-all flex items-center gap-1 font-bold text-[11px]"
                title="Email Dealer"
              >
                <Mail className="w-3.5 h-3.5 text-[var(--copper-600)]" />
                <span className="hidden sm:inline">Email</span>
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onConnect ? onConnect(dealer) : onHire(dealer)}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-copper-400" />
            <span>Connect & Fix Meeting</span>
          </button>
          
          <button
            type="button"
            onClick={() => onHire(dealer)}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-[var(--copper-600)] hover:bg-[var(--copper-700)] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-lg"
          >
            <span>Hire Project</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

