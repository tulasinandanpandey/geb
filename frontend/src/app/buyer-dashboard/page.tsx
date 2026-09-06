"use client";

import Link from "next/link";
import { Suspense, useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  Building2,
  MapPin,
  MessageSquare,
  Calendar,
  HelpCircle,
  Heart,
  User,
  Loader2,
  RefreshCw,
  Activity,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  DollarSign,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Wrench,
  HardHat,
  Send,
} from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/components/auth/AuthProvider";
import { getProperties } from "@/services/properties";
import { Property } from "@/types/property";
import GEBChatModal from "@/components/chat/GEBChatModal";
import { supabase } from "@/lib/supabase/client";
import {
  Conversation,
  listConversations,
  getConversationMessages,
} from "@/services/conversations";

function BuyerDashboardContent() {
  const { user, loading: authLoading, roles } = useAuth();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    "projects" | "profile" | "conversations" | "saved" | "followups" | "meetings"
  >("projects");

  // Data states
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [lastMessages, setLastMessages] = useState<Record<string, string>>({});
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [followups, setFollowups] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);

  // Project Monitoring States
  const [buyerProjects, setBuyerProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectDetails, setProjectDetails] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [projectLoading, setProjectLoading] = useState(false);
  const [buyerChatMsg, setBuyerChatMsg] = useState("");
  const [sendingBuyerMsg, setSendingBuyerMsg] = useState(false);
  
  // Loading & error states
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");

  // Modal states
  const [chatOpen, setChatOpen] = useState(false);
  const [activeChatConversation, setActiveChatConversation] = useState<Conversation | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  // Initialize active tab from query parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["projects", "profile", "conversations", "saved", "followups", "meetings"].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  // Load all buyer-specific data
  async function loadBuyerData() {
    if (!user) return;
    try {
      setLoadingData(true);
      setError("");

      // 1. Fetch conversations
      const allConvs = await listConversations();
      // Filter to show conversations where the logged-in user is the buyer
      const buyerConvs = allConvs.filter((c) => String(c.buyer_id) === String(user.id));
      setConversations(buyerConvs);

      // 2. Fetch followups from Supabase
      const { data: followupsData, error: followupsErr } = await supabase
        .from("follow_ups")
        .select("*, property:properties(id, title, price, city, image, locality), seller:profiles!follow_ups_seller_id_fkey(id, full_name, email)")
        .eq("buyer_id", user.id)
        .order("updated_at", { ascending: false });
      if (followupsErr) throw followupsErr;
      setFollowups(followupsData || []);

      // 3. Fetch meetings from Supabase
      const { data: meetingsData, error: meetingsErr } = await supabase
        .from("meetings")
        .select("*, property:properties(id, title, price, city, image, locality), seller:profiles!meetings_seller_id_fkey(id, full_name, email)")
        .eq("buyer_id", user.id)
        .order("updated_at", { ascending: false });
      if (meetingsErr) throw meetingsErr;
      setMeetings(meetingsData || []);

      // 4. Fetch saved properties from localStorage
      const savedIdsStr = localStorage.getItem("geb_saved_properties");
      if (savedIdsStr) {
        const savedIds: string[] = JSON.parse(savedIdsStr);
        if (savedIds.length > 0) {
          const allProps = await getProperties();
          const filtered = allProps.filter((p) => savedIds.includes(p.id));
          setSavedProperties(filtered);
        } else {
          setSavedProperties([]);
        }
      } else {
        setSavedProperties([]);
      }

      // 5. Fetch Projects for Buyer
      const session = JSON.parse(localStorage.getItem("sb-ljqkrzikddhaltdxlpfj-auth-token") || "{}");
      const token = session?.access_token || "";
      const projRes = await fetch(`${API_URL}/api/projects`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (projRes.ok) {
        const projData = await projRes.json();
        const pList = projData.projects || [];
        setBuyerProjects(pList);
        if (pList.length > 0 && !selectedProjectId) {
          setSelectedProjectId(pList[0].id);
        }
      }

    } catch (err: any) {
      console.error("Error loading buyer dashboard details:", err);
      setError(err.message || "Failed to load dashboard details.");
    } finally {
      setLoadingData(false);
    }
  }

  // Load selected project details & AI analysis
  useEffect(() => {
    if (!selectedProjectId) return;

    async function fetchProjectAiAndDetails() {
      setProjectLoading(true);
      try {
        const detRes = await fetch(`${API_URL}/api/projects/${selectedProjectId}`);
        if (detRes.ok) {
          setProjectDetails(await detRes.json());
        }

        const aiRes = await fetch(`${API_URL}/api/projects/${selectedProjectId}/ai-analysis`);
        if (aiRes.ok) {
          setAiAnalysis(await aiRes.json());
        }
      } catch (err) {
        console.error("Error fetching project AI report:", err);
      } finally {
        setProjectLoading(false);
      }
    }

    fetchProjectAiAndDetails();
  }, [selectedProjectId, API_URL]);

  // Send message to project chat
  async function handleSendBuyerMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProjectId || !buyerChatMsg.trim()) return;

    setSendingBuyerMsg(true);
    try {
      const session = JSON.parse(localStorage.getItem("sb-ljqkrzikddhaltdxlpfj-auth-token") || "{}");
      const token = session?.access_token || "";

      const res = await fetch(`${API_URL}/api/projects/${selectedProjectId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          message: buyerChatMsg,
          sender_name: user?.email?.split("@")[0] || "Buyer",
          sender_role: "buyer",
        }),
      });

      if (res.ok) {
        setBuyerChatMsg("");
        const detRes = await fetch(`${API_URL}/api/projects/${selectedProjectId}`);
        if (detRes.ok) setProjectDetails(await detRes.json());
      }
    } catch (err) {
      console.error("Error sending buyer message:", err);
    } finally {
      setSendingBuyerMsg(false);
    }
  }

  // Fetch last message for each conversation
  useEffect(() => {
    if (conversations.length > 0) {
      conversations.forEach(async (conv) => {
        try {
          const messages = await getConversationMessages(conv.id);
          if (messages.length > 0) {
            setLastMessages((prev) => ({
              ...prev,
              [conv.id]: messages[messages.length - 1].message,
            }));
          } else {
            setLastMessages((prev) => ({
              ...prev,
              [conv.id]: "No messages yet.",
            }));
          }
        } catch (err) {
          console.error(`Failed to load messages for conversation ${conv.id}:`, err);
        }
      });
    }
  }, [conversations]);

  useEffect(() => {
    if (!authLoading && user) {
      loadBuyerData();
    }
  }, [authLoading, user]);

  const handleOpenConversation = (conv: Conversation) => {
    setActiveChatConversation(conv);
    setChatOpen(true);
  };

  const handleToggleSaveProperty = (propertyId: string) => {
    const savedIdsStr = localStorage.getItem("geb_saved_properties");
    let savedIds: string[] = savedIdsStr ? JSON.parse(savedIdsStr) : [];
    if (savedIds.includes(propertyId)) {
      savedIds = savedIds.filter((id) => id !== propertyId);
      setSavedProperties((prev) => prev.filter((p) => p.id !== propertyId));
    } else {
      savedIds.push(propertyId);
    }
    localStorage.setItem("geb_saved_properties", JSON.stringify(savedIds));
    if (selectedProperty && selectedProperty.id === propertyId) {
      setSelectedProperty(null);
    }
    loadBuyerData();
  };

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--paper)]">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-[var(--ink)]" />
          <p className="text-sm font-medium text-[var(--ink-soft)]">Loading your account...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--paper)] px-6">
        <div className="max-w-md rounded-[2rem] border border-[var(--stone-line)] bg-white p-8 text-center shadow-xl">
          <User className="mx-auto mb-5 text-[var(--ink-soft)]" size={32} />
          <h1 className="font-display text-4xl font-medium">Sign in required</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
            Sign in to view your profile, contacted sellers, and scheduled visits.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--ink)] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--copper-700)]"
          >
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <Navbar />

      {/* HEADER */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(circle at 85% 0%, var(--copper-100), transparent 45%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-6 pb-6 pt-12 lg:px-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--copper-700)]">
                Buyer Portal
              </p>
              <h1 className="font-display text-5xl font-medium tracking-tight md:text-6xl">
                My GEB Account
              </h1>
              <p className="mt-3 max-w-xl text-[var(--ink-soft)]">
                Manage your personal real estate discovery account, contacted properties, follow-ups, and scheduled visits.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={loadBuyerData}
                disabled={loadingData}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--stone-line)] bg-white px-5 py-3 text-sm font-semibold hover:border-[var(--copper-400)] transition shadow-sm disabled:opacity-50"
              >
                <RefreshCw size={15} className={loadingData ? "animate-spin" : ""} />
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* TABS NAVIGATION */}
      <section className="mx-auto max-w-7xl px-6 pb-8 lg:px-8">
        <div className="flex w-full items-center gap-1 overflow-x-auto rounded-full border border-[var(--stone-line)] bg-white p-1.5 scrollbar-none">
          {[
            { id: "projects", label: "My Projects & GEB AI", icon: Activity },
            { id: "profile", label: "My Profile", icon: User },
            { id: "conversations", label: "Contacted Sellers", icon: MessageSquare },
            { id: "saved", label: "Saved Properties", icon: Heart },
            { id: "followups", label: "My Follow-ups", icon: HelpCircle },
            { id: "meetings", label: "My Meetings", icon: Calendar },
          ].map((tab) => {
            const ActiveIcon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  startTransition(() => {
                    setActiveTab(tab.id as any);
                  });
                }}
                className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition shrink-0 ${
                  active
                    ? "bg-[var(--ink)] text-white font-bold"
                    : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                }`}
              >
                <ActiveIcon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* DASHBOARD BODY */}
      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {/* PROJECTS & GEB AI MONITOR TAB */}
        {activeTab === "projects" && (
          <div className="space-y-8">
            {buyerProjects.length === 0 ? (
              <div className="rounded-[2.5rem] border border-[var(--stone-line)] bg-white p-12 text-center space-y-4">
                <HardHat className="w-12 h-12 text-[var(--stone-line)] mx-auto" />
                <h3 className="text-xl font-bold text-[var(--ink)]">No Active Construction Projects</h3>
                <p className="text-xs text-[var(--ink-soft)] max-w-md mx-auto">
                  You haven&apos;t hired any dealer or engineer yet. Hire a verified dealer from the GEB Marketplace to unlock real-time project monitoring and GEB AI risk alerts.
                </p>
                <Link
                  href="/dealers"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--copper-600)] text-white text-xs font-bold shadow-md hover:bg-[var(--copper-700)]"
                >
                  <HardHat className="w-4 h-4" />
                  <span>Explore Dealer Marketplace</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Project Selector Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-[var(--stone-line)] bg-white p-6 shadow-sm">
                  <div>
                    <h3 className="text-lg font-extrabold text-[var(--ink)]">Hired Construction Projects</h3>
                    <p className="text-xs text-[var(--ink-soft)]">
                      Hired Dealer: <span className="font-bold text-[var(--copper-700)]">{projectDetails?.dealer?.full_name || "Assigned Engineer"}</span>
                    </p>
                  </div>

                  {buyerProjects.length > 1 && (
                    <div className="w-full sm:w-64">
                      <select
                        value={selectedProjectId || ""}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl bg-[var(--paper)] border border-[var(--stone-line)] text-xs font-bold focus:outline-none"
                      >
                        {buyerProjects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title} ({p.progress_pct}%)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* GEB AI PROJECT RISK MONITORING WIDGET */}
                {aiAnalysis && (
                  <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-200/60 pb-5">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-extrabold text-amber-950">GEB Project AI Risk Engine</h3>
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-bold uppercase tracking-wider">
                              Real-Time Analysis
                            </span>
                          </div>
                          <p className="text-xs text-amber-800 font-medium mt-0.5">
                            Automated timeline delay analysis, budget variance, and milestone risk detection.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold border shadow-sm ${
                          aiAnalysis.badge_color === "red"
                            ? "bg-rose-100 text-rose-800 border-rose-300"
                            : aiAnalysis.badge_color === "amber"
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : "bg-emerald-100 text-emerald-800 border-emerald-300"
                        }`}>
                          {aiAnalysis.overall_status}
                        </span>
                        <div className="px-3.5 py-1.5 rounded-full bg-white border border-amber-200 text-xs font-black text-amber-900 shadow-xs">
                          Risk Score: {aiAnalysis.risk_score} / 100
                        </div>
                      </div>
                    </div>

                    {/* Key System Risk Alerts */}
                    {aiAnalysis.alerts && aiAnalysis.alerts.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-amber-950 uppercase tracking-wider">Active System Alerts</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {aiAnalysis.alerts.map((alert: string, idx: number) => (
                            <div key={idx} className="p-3.5 rounded-2xl bg-white border border-amber-200/80 text-xs font-semibold text-amber-900 flex items-start gap-2.5 shadow-xs">
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <span>{alert}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Gemini Plain-Language Report */}
                    {aiAnalysis.ai_explanation && (
                      <div className="p-5 rounded-2xl bg-white border border-stone-200/80 text-xs leading-relaxed text-stone-800 space-y-3 shadow-xs">
                        <div className="flex items-center gap-2 font-bold text-amber-900 border-b border-stone-100 pb-2">
                          <Sparkles className="w-4 h-4 text-amber-600" />
                          <span>AI Executive Insight & Recommended Next Steps</span>
                        </div>
                        <div className="whitespace-pre-line text-stone-700">
                          {aiAnalysis.ai_explanation}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Project Financial & Progress Grid */}
                {projectDetails && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="rounded-3xl border border-[var(--stone-line)] bg-white p-5 space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">Total Budget</p>
                      <p className="text-xl font-black text-[var(--ink)]">₹{Number(projectDetails.total_budget || 0).toLocaleString()}</p>
                    </div>
                    <div className="rounded-3xl border border-[var(--stone-line)] bg-white p-5 space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">Amount Spent</p>
                      <p className="text-xl font-black text-rose-600">₹{Number(projectDetails.spent_amount || 0).toLocaleString()}</p>
                    </div>
                    <div className="rounded-3xl border border-[var(--stone-line)] bg-white p-5 space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">Remaining Capital</p>
                      <p className="text-xl font-black text-emerald-600">
                        ₹{Math.max(0, Number(projectDetails.total_budget || 0) - Number(projectDetails.spent_amount || 0)).toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-3xl border border-[var(--stone-line)] bg-white p-5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[var(--ink-soft)]">Overall Progress</span>
                        <span className="font-extrabold text-[var(--copper-700)]">{projectDetails.progress_pct}%</span>
                      </div>
                      <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[var(--copper-500)] to-emerald-500 h-full rounded-full"
                          style={{ width: `${projectDetails.progress_pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Milestones & Expenses Split View */}
                {projectDetails && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Milestones */}
                    <div className="rounded-3xl border border-[var(--stone-line)] bg-white p-6 space-y-4">
                      <h4 className="font-extrabold text-base text-[var(--ink)]">Construction Milestones</h4>
                      <div className="space-y-3">
                        {projectDetails.milestones?.map((m: any, idx: number) => (
                          <div key={m.id || idx} className="p-4 rounded-2xl bg-[var(--paper)] border border-[var(--stone-line)] space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[var(--ink)]">{m.title}</span>
                              <span className="font-bold text-[var(--copper-700)]">{m.progress_pct || 0}%</span>
                            </div>
                            <p className="text-[11px] text-[var(--ink-soft)]">{m.description}</p>
                            <div className="flex items-center justify-between text-[11px] text-[var(--ink-soft)] pt-1">
                              <span>Target: {m.target_date}</span>
                              <span className="font-semibold text-stone-700">Budget: ₹{(m.budget_allocated || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Dealer Updates & Expenses */}
                    <div className="rounded-3xl border border-[var(--stone-line)] bg-white p-6 space-y-4">
                      <h4 className="font-extrabold text-base text-[var(--ink)]">Latest Dealer Site Logs & Invoices</h4>
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                        {projectDetails.updates?.map((u: any, idx: number) => (
                          <div key={u.id || idx} className="p-3.5 rounded-2xl bg-[var(--paper)] border border-[var(--stone-line)] space-y-1 text-xs">
                            <div className="flex items-center justify-between font-bold text-[var(--ink)]">
                              <span>{u.title}</span>
                              <span className="text-[10px] text-[var(--ink-soft)]">{u.log_date}</span>
                            </div>
                            <p className="text-xs text-[var(--ink-soft)] leading-relaxed">{u.notes}</p>
                          </div>
                        ))}

                        {projectDetails.expenses?.map((e: any, idx: number) => (
                          <div key={e.id || idx} className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/60 flex items-center justify-between text-xs">
                            <div>
                              <p className="font-bold text-amber-950">{e.title}</p>
                              <p className="text-[10px] text-amber-800">Vendor: {e.vendor || "Supplier"} • {e.expense_date}</p>
                            </div>
                            <span className="font-extrabold text-amber-900">₹{Number(e.amount || 0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Buyer ↔ Dealer Project Chat Box */}
                {projectDetails && (
                  <div className="rounded-3xl border border-[var(--stone-line)] bg-white p-6 space-y-4">
                    <h4 className="font-extrabold text-base text-[var(--ink)] flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[var(--copper-600)]" />
                      <span>Project Communication Thread with Dealer</span>
                    </h4>

                    <div className="h-64 overflow-y-auto p-4 rounded-2xl bg-[var(--paper)] border border-[var(--stone-line)] space-y-3">
                      {projectDetails.messages?.length === 0 ? (
                        <p className="text-xs text-[var(--ink-soft)] text-center py-8">No messages sent yet. Ask your dealer engineer any questions about construction progress.</p>
                      ) : (
                        projectDetails.messages?.map((m: any, idx: number) => (
                          <div key={m.id || idx} className={`flex flex-col ${m.sender_role === "buyer" ? "items-end" : "items-start"}`}>
                            <span className="text-[10px] font-semibold text-[var(--ink-soft)] px-1">
                              {m.sender_name} ({m.sender_role})
                            </span>
                            <div className={`p-3 rounded-2xl text-xs max-w-md ${
                              m.sender_role === "buyer"
                                ? "bg-[var(--ink)] text-white"
                                : "bg-[var(--copper-100)] text-[var(--copper-900)] font-medium"
                            }`}>
                              {m.message}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <form onSubmit={handleSendBuyerMessage} className="flex gap-3">
                      <input
                        type="text"
                        value={buyerChatMsg}
                        onChange={(e) => setBuyerChatMsg(e.target.value)}
                        placeholder="Ask dealer engineer about timeline, site visit, or materials..."
                        className="flex-1 px-4 py-2.5 rounded-2xl bg-[var(--paper)] border border-[var(--stone-line)] text-xs font-semibold focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={sendingBuyerMsg}
                        className="px-5 py-2.5 rounded-2xl bg-[var(--copper-600)] hover:bg-[var(--copper-700)] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        <span>Send</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="max-w-2xl rounded-[2.5rem] border border-[var(--stone-line)] bg-white p-6 md:p-8 shadow-sm">
            <h3 className="font-display text-2xl font-semibold mb-6">Profile Settings</h3>
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">Email Address</p>
                <p className="text-sm font-semibold mt-1">{user.email}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">Full Name</p>
                <p className="text-sm font-semibold mt-1">
                  {user.user_metadata?.full_name || "GEB User"}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">Account Capabilities</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {roles.map((role) => (
                    <span
                      key={role}
                      className="rounded-full bg-[var(--paper)] border border-[var(--stone-line)] px-3 py-1 text-[11px] font-bold capitalize text-[var(--ink-soft)]"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--stone-line)]">
                <Link
                  href="/capabilities"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--ink)] px-5 py-3 text-xs font-bold text-white transition hover:bg-[var(--copper-700)]"
                >
                  Adjust My Capabilities / Roles
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* CONVERSATIONS TAB */}
        {activeTab === "conversations" && (
          <div className="space-y-4">
            <h3 className="font-display text-2xl font-semibold mb-4">Contacted Sellers</h3>
            {loadingData ? (
              <div className="p-12 text-center text-[var(--ink-soft)] bg-white border border-[var(--stone-line)] rounded-3xl">
                <Loader2 className="animate-spin mx-auto mb-2 text-[var(--ink-soft)]" size={24} />
                <span>Loading conversations...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-12 text-center bg-white border border-dashed border-[var(--stone-line)] rounded-[2.5rem] text-[var(--ink-soft)]">
                <MessageSquare className="mx-auto mb-4 text-[var(--ink-soft)]" size={32} />
                <h4 className="text-base font-semibold">You haven&apos;t contacted any sellers yet.</h4>
                <p className="text-xs text-[var(--ink-soft)] mt-1 max-w-sm mx-auto">
                  Browse listed properties on our platform and click &ldquo;Contact Seller&rdquo; to begin a conversation.
                </p>
                <Link
                  href="/"
                  className="mt-5 inline-flex items-center justify-center rounded-full bg-[var(--ink)] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[var(--copper-700)]"
                >
                  Explore Properties
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 max-w-4xl">
                {conversations.map((conv) => {
                  const sellerName = conv.seller.full_name || conv.seller.email || "Verified Seller";
                  return (
                    <div
                      key={conv.id}
                      className="p-5 rounded-[2rem] border border-[var(--stone-line)] bg-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition duration-300"
                    >
                      <div className="flex gap-4 items-center min-w-0">
                        {conv.property.image && (
                          <img
                            src={conv.property.image}
                            alt=""
                            className="h-14 w-14 object-cover rounded-2xl shrink-0 border border-[var(--stone-line)]"
                          />
                        )}
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-[var(--ink)] truncate">
                            {conv.property.title}
                          </h4>
                          <p className="text-xs text-[var(--ink-soft)] font-semibold mt-0.5">
                            {conv.property.city} · Seller: {sellerName}
                          </p>
                          {lastMessages[conv.id] && (
                            <p className="text-xs text-[var(--ink-soft)] mt-2 font-medium truncate italic max-w-xs md:max-w-md">
                              Last Message: &ldquo;{lastMessages[conv.id]}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 self-end md:self-auto">
                        <button
                          onClick={() => handleOpenConversation(conv)}
                          className="bg-[var(--ink)] hover:bg-[var(--copper-700)] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm"
                        >
                          Open Chat
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SAVED PROPERTIES TAB */}
        {activeTab === "saved" && (
          <div>
            <h3 className="font-display text-2xl font-semibold mb-6">Saved Properties</h3>
            {loadingData ? (
              <div className="p-12 text-center text-[var(--ink-soft)] bg-white border border-[var(--stone-line)] rounded-3xl">
                <Loader2 className="animate-spin mx-auto mb-2 text-[var(--ink-soft)]" size={24} />
                <span>Loading properties...</span>
              </div>
            ) : savedProperties.length === 0 ? (
              <div className="p-12 text-center bg-white border border-dashed border-[var(--stone-line)] rounded-[2.5rem] text-[var(--ink-soft)]">
                <Heart className="mx-auto mb-4 text-[var(--ink-soft)]" size={32} />
                <h4 className="text-base font-semibold">You haven&apos;t saved any properties yet.</h4>
                <p className="text-xs text-[var(--ink-soft)] mt-1 max-w-sm mx-auto">
                  Click the bookmark/heart button on property details modals to save properties here for easy access.
                </p>
                <Link
                  href="/"
                  className="mt-5 inline-flex items-center justify-center rounded-full bg-[var(--ink)] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[var(--copper-700)]"
                >
                  Explore Properties
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {savedProperties.map((property) => (
                  <article
                    key={property.id}
                    className="overflow-hidden rounded-[2rem] border border-[var(--stone-line)] bg-white shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-48 bg-[var(--paper)]">
                        {property.image ? (
                          <img
                            src={property.image}
                            alt={property.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[var(--ink-soft)]">
                            <Building2 size={30} />
                          </div>
                        )}
                        <button
                          onClick={() => handleToggleSaveProperty(property.id)}
                          className="absolute right-3 top-3 p-2 rounded-full bg-white/90 text-red-500 shadow-sm backdrop-blur"
                        >
                          <Heart size={16} fill="currentColor" />
                        </button>
                      </div>

                      <div className="p-5">
                        <h3 className="truncate font-semibold text-[var(--ink)]">{property.title}</h3>
                        <p className="mt-1 text-xs text-[var(--ink-soft)] capitalize">
                          {property.propertyType}
                        </p>
                        <p className="mt-3 text-lg font-bold text-[var(--ink)]">
                          ₹{property.price.toLocaleString("en-IN")}
                        </p>
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-[var(--ink-soft)]">
                          <MapPin size={13} />
                          <span className="truncate">
                            {property.locality ? `${property.locality}, ` : ""}
                            {property.city}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0 mt-2 flex gap-2">
                      <button
                        onClick={() => setSelectedProperty(property)}
                        className="flex-1 bg-[var(--ink)] text-white hover:bg-[var(--copper-700)] font-bold py-2.5 rounded-xl text-xs transition"
                      >
                        View Details
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FOLLOWUPS TAB */}
        {activeTab === "followups" && (
          <div className="space-y-4">
            <h3 className="font-display text-2xl font-semibold mb-4">My Follow-up Queries</h3>
            {loadingData ? (
              <div className="p-12 text-center text-[var(--ink-soft)] bg-white border border-[var(--stone-line)] rounded-3xl">
                <Loader2 className="animate-spin mx-auto mb-2 text-[var(--ink-soft)]" size={24} />
                <span>Loading follow-ups...</span>
              </div>
            ) : followups.length === 0 ? (
              <div className="p-12 text-center bg-white border border-dashed border-[var(--stone-line)] rounded-[2.5rem] text-[var(--ink-soft)]">
                <HelpCircle className="mx-auto mb-4 text-[var(--ink-soft)]" size={32} />
                <h4 className="text-base font-semibold">No pending follow-ups.</h4>
                <p className="text-xs text-[var(--ink-soft)] mt-1 max-w-sm mx-auto">
                  When you ask legal or custom questions to the Seller AI Agent, it flags them as follow-ups for the human seller to answer.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 max-w-3xl">
                {followups.map((fu) => (
                  <div
                    key={fu.id}
                    className="p-5 rounded-[2rem] border border-[var(--stone-line)] bg-white shadow-sm space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span
                          className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full capitalize mr-2 ${
                            fu.status === "open"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {fu.status}
                        </span>
                        <span className="text-xs font-bold text-[var(--ink-soft)]">
                          🏡 {fu.property?.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--ink-soft)] font-semibold">
                        {new Date(fu.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="bg-[var(--paper)] border border-[var(--stone-line)] p-4 rounded-2xl">
                      <p className="text-[10px] font-bold text-[var(--ink-soft)] uppercase tracking-wider">My Question:</p>
                      <p className="text-xs font-semibold text-[var(--ink-soft)] mt-1">&ldquo;{fu.question}&rdquo;</p>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <p className="text-xs text-[var(--ink-soft)] font-medium">
                        {fu.status === "open" ? (
                          <span className="text-amber-600 font-bold">Pending response from owner.</span>
                        ) : (
                          <span className="text-emerald-600 font-bold">Answered! Seller replied in chat history.</span>
                        )}
                      </p>
                      {conversations.find((c) => c.id === fu.conversation_id) && (
                        <button
                          onClick={() => {
                            const conv = conversations.find((c) => c.id === fu.conversation_id);
                            if (conv) handleOpenConversation(conv);
                          }}
                          className="text-xs font-bold bg-[var(--ink)] hover:bg-[var(--copper-700)] text-white px-4 py-2.5 rounded-xl transition"
                        >
                          Open Chat
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MEETINGS TAB */}
        {activeTab === "meetings" && (
          <div className="space-y-4">
            <h3 className="font-display text-2xl font-semibold mb-4">My Scheduled Visits</h3>
            {loadingData ? (
              <div className="p-12 text-center text-[var(--ink-soft)] bg-white border border-[var(--stone-line)] rounded-3xl">
                <Loader2 className="animate-spin mx-auto mb-2 text-[var(--ink-soft)]" size={24} />
                <span>Loading meetings...</span>
              </div>
            ) : meetings.length === 0 ? (
              <div className="p-12 text-center bg-white border border-dashed border-[var(--stone-line)] rounded-[2.5rem] text-[var(--ink-soft)]">
                <Calendar className="mx-auto mb-4 text-[var(--ink-soft)]" size={32} />
                <h4 className="text-base font-semibold">No upcoming meetings.</h4>
                <p className="text-xs text-[var(--ink-soft)] mt-1 max-w-sm mx-auto">
                  When you request site visits, they will show up here along with their scheduling details and status.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 max-w-3xl">
                {meetings.map((meet) => (
                  <div
                    key={meet.id}
                    className="p-5 rounded-[2rem] border border-[var(--stone-line)] bg-white shadow-sm space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span
                          className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full capitalize mr-2 ${
                            meet.status === "pending"
                              ? "bg-rose-50 text-rose-700"
                              : meet.status === "confirmed"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-[var(--paper)] text-[var(--ink-soft)]"
                          }`}
                        >
                          {meet.status}
                        </span>
                        <span className="text-xs font-bold text-[var(--ink-soft)]">
                          🏡 {meet.property?.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--ink-soft)] font-semibold">
                        {new Date(meet.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="bg-[var(--paper)] border border-[var(--stone-line)] p-4 rounded-2xl flex flex-col sm:flex-row justify-between gap-3 text-xs font-semibold">
                      <div>
                        <p className="text-[var(--ink-soft)]">Scheduled Date & Time:</p>
                        <p className="text-[var(--ink)] font-bold mt-1 text-sm">
                          📅 {meet.requested_date} at {meet.requested_time}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <p className="text-xs text-[var(--ink-soft)] font-semibold">
                        {meet.status === "pending" && "Waiting for seller approval."}
                        {meet.status === "confirmed" && "Confirmed! Looking forward to your visit."}
                        {meet.status === "rescheduled" && "Rescheduled. Seller proposed a new slot."}
                        {meet.status === "rejected" && "Visit declined by seller."}
                      </p>
                      {conversations.find((c) => c.id === meet.conversation_id) && (
                        <button
                          onClick={() => {
                            const conv = conversations.find((c) => c.id === meet.conversation_id);
                            if (conv) handleOpenConversation(conv);
                          }}
                          className="text-xs font-bold bg-[var(--ink)] hover:bg-[var(--copper-700)] text-white px-4 py-2.5 rounded-xl transition"
                        >
                          Open Chat
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[var(--stone-line)] px-6 py-8 text-center text-sm text-[var(--ink-soft)]">
        © 2026 GEB · Global Estate Bridge
      </footer>

      {/* CHAT MODAL */}
      <GEBChatModal
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        directConversation={activeChatConversation}
        initialMode="buyer"
      />

      {/* PROPERTY DETAILS MODAL */}
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
                onClick={() => setSelectedProperty(null)}
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-xl font-medium shadow-lg transition hover:bg-white"
                aria-label="Close property details"
              >
                ×
              </button>
            </div>

            <div className="p-6 md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-3xl font-bold tracking-tight">
                    ₹{selectedProperty.price.toLocaleString("en-IN")}
                  </p>

                  <h2 className="mt-2 font-display text-4xl font-medium tracking-tight">
                    {selectedProperty.title}
                  </h2>

                  <div className="mt-3 flex items-center gap-2 text-sm text-[var(--ink-soft)]">
                    <MapPin size={16} />
                    {selectedProperty.locality ? `${selectedProperty.locality}, ` : ""}
                    {selectedProperty.city}
                  </div>
                </div>
              </div>

              {selectedProperty.description && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold">About this property</h3>
                  <p className="mt-2 leading-7 text-[var(--ink-soft)]">{selectedProperty.description}</p>
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => handleToggleSaveProperty(selectedProperty.id)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[var(--stone-line)] px-6 py-3 font-semibold transition hover:bg-[var(--paper)]"
                >
                  <Heart size={16} fill="currentColor" className="text-red-500" />
                  Unsave Property
                </button>
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="rounded-full border border-[var(--stone-line)] px-6 py-3 font-semibold transition hover:bg-[var(--paper)]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function BuyerDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <BuyerDashboardContent />
    </Suspense>
  );
}
