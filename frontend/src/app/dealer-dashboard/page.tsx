"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import {
  Wrench,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Plus,
  MessageSquare,
  FileText,
  Calendar,
  Send,
  Building2,
  HardHat,
  ChevronRight,
  Sparkles,
  PieChart,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";

interface ProjectItem {
  id: string;
  title: string;
  description?: string;
  project_type: string;
  status: string;
  total_budget: number;
  spent_amount: number;
  progress_pct: number;
  start_date: string;
  target_completion_date: string;
  city?: string;
  locality?: string;
  milestones?: any[];
  updates?: any[];
  expenses?: any[];
  messages?: any[];
}

export default function DealerDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectDetails, setProjectDetails] = useState<ProjectItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Active tab inside project dashboard
  const [activeTab, setActiveTab] = useState<"overview" | "milestones" | "updates" | "expenses" | "chat">("overview");

  // Post update form state
  const [updateTitle, setUpdateTitle] = useState("Weekly Site Progress Log");
  const [updateNotes, setUpdateNotes] = useState("");
  const [progressDelta, setProgressDelta] = useState("5");
  const [submittingUpdate, setSubmittingUpdate] = useState(false);

  // Expense upload modal state
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("invoice");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [expenseNotes, setExpenseNotes] = useState("");
  const [submittingExpense, setSubmittingExpense] = useState(false);

  // Chat message state
  const [chatInput, setChatInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  // Fetch projects
  useEffect(() => {
    async function loadProjects() {
      setLoading(true);
      try {
        const session = JSON.parse(localStorage.getItem("sb-ljqkrzikddhaltdxlpfj-auth-token") || "{}");
        const token = session?.access_token || "";

        const res = await fetch(`${API_URL}/api/projects`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          const list: ProjectItem[] = data.projects || [];
          setProjects(list);
          if (list.length > 0 && !selectedProjectId) {
            setSelectedProjectId(list[0].id);
          }
        }
      } catch (err) {
        console.error("Error loading projects:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, [API_URL]);

  // Fetch selected project details
  useEffect(() => {
    if (!selectedProjectId) return;

    async function loadProjectDetails() {
      try {
        const res = await fetch(`${API_URL}/api/projects/${selectedProjectId}`);
        if (res.ok) {
          const data = await res.json();
          setProjectDetails(data);
        }
      } catch (err) {
        console.error("Error loading project details:", err);
      }
    }

    loadProjectDetails();
  }, [selectedProjectId, API_URL]);

  // Handle Post Update
  async function handlePostUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProjectId || !updateNotes.trim()) return;

    setSubmittingUpdate(true);
    try {
      const session = JSON.parse(localStorage.getItem("sb-ljqkrzikddhaltdxlpfj-auth-token") || "{}");
      const token = session?.access_token || "";

      const res = await fetch(`${API_URL}/api/projects/${selectedProjectId}/updates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          title: updateTitle,
          notes: updateNotes,
          progress_delta: Number(progressDelta),
          author_name: user?.email?.split("@")[0] || "Dealer Engineer",
          author_role: "dealer",
        }),
      });

      if (res.ok) {
        setUpdateNotes("");
        // Reload details
        const detRes = await fetch(`${API_URL}/api/projects/${selectedProjectId}`);
        if (detRes.ok) setProjectDetails(await detRes.json());
      }
    } catch (err) {
      console.error("Error posting update:", err);
    } finally {
      setSubmittingUpdate(false);
    }
  }

  // Handle Post Expense
  async function handlePostExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProjectId || !expenseTitle.trim() || !expenseAmount) return;

    setSubmittingExpense(true);
    try {
      const session = JSON.parse(localStorage.getItem("sb-ljqkrzikddhaltdxlpfj-auth-token") || "{}");
      const token = session?.access_token || "";

      const res = await fetch(`${API_URL}/api/projects/${selectedProjectId}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          title: expenseTitle,
          category: expenseCategory,
          amount: Number(expenseAmount),
          vendor: vendorName,
          notes: expenseNotes,
        }),
      });

      if (res.ok) {
        setExpenseModalOpen(false);
        setExpenseTitle("");
        setExpenseAmount("");
        setVendorName("");
        setExpenseNotes("");

        // Reload details
        const detRes = await fetch(`${API_URL}/api/projects/${selectedProjectId}`);
        if (detRes.ok) setProjectDetails(await detRes.json());
      }
    } catch (err) {
      console.error("Error posting expense:", err);
    } finally {
      setSubmittingExpense(false);
    }
  }

  // Handle Update Milestone Progress
  async function handleUpdateMilestone(milestoneId: string, currentPct: number) {
    const newPct = Math.min(100, currentPct + 25);
    try {
      const res = await fetch(`${API_URL}/api/projects/${selectedProjectId}/milestones/${milestoneId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress_pct: newPct }),
      });
      if (res.ok) {
        const detRes = await fetch(`${API_URL}/api/projects/${selectedProjectId}`);
        if (detRes.ok) setProjectDetails(await detRes.json());
      }
    } catch (err) {
      console.error("Error updating milestone:", err);
    }
  }

  // Handle Send Chat Message
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProjectId || !chatInput.trim()) return;

    setSendingMsg(true);
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
          message: chatInput,
          sender_name: user?.email?.split("@")[0] || "Dealer Engineer",
          sender_role: "dealer",
        }),
      });

      if (res.ok) {
        setChatInput("");
        const detRes = await fetch(`${API_URL}/api/projects/${selectedProjectId}`);
        if (detRes.ok) setProjectDetails(await detRes.json());
      }
    } catch (err) {
      console.error("Error sending chat message:", err);
    } finally {
      setSendingMsg(false);
    }
  }

  const budget = Number(projectDetails?.total_budget || 0);
  const spent = Number(projectDetails?.spent_amount || 0);
  const remaining = Math.max(0, budget - spent);
  const progressPct = Number(projectDetails?.progress_pct || 0);

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Title & Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--paper-raised)] p-6 rounded-3xl border border-[var(--stone-line)] shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[var(--copper-600)] text-white flex items-center justify-center shadow-md">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[var(--ink)]">Dealer Project Dashboard</h1>
              <p className="text-xs text-[var(--ink-soft)] font-medium">
                Manage site milestones, log updates, record invoices, and communicate with buyers.
              </p>
            </div>
          </div>

          {/* Project Dropdown Selector & Profile Action */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {projects.length > 0 && (
              <div className="w-full sm:w-64">
                <label className="block text-[10px] font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-1">
                  Active Project
                </label>
                <select
                  value={selectedProjectId || ""}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[var(--paper)] border border-[var(--stone-line)] text-xs font-bold focus:outline-none focus:border-[var(--copper-600)]"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.progress_pct}%)
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="button"
              onClick={() => router.push("/dealers")}
              className="mt-4 sm:mt-0 px-4 py-2.5 rounded-2xl bg-[var(--copper-600)] hover:bg-[var(--copper-700)] text-white text-xs font-bold transition-all shadow-sm shrink-0"
            >
              Marketplace Profile & Listing
            </button>
          </div>
        </div>

        {loading ? (
          <div className="h-96 rounded-3xl bg-[var(--paper-raised)] border border-[var(--stone-line)] animate-pulse" />
        ) : !projectDetails ? (
          <div className="bg-[var(--paper-raised)] rounded-3xl border border-[var(--stone-line)] p-12 text-center space-y-4">
            <HardHat className="w-12 h-12 text-[var(--stone-line)] mx-auto" />
            <h3 className="text-base font-bold text-[var(--ink)]">No Active Hired Projects</h3>
            <p className="text-xs text-[var(--ink-soft)] max-w-md mx-auto">
              You do not have any active construction or renovation projects assigned. Visit the Marketplace or share your dealer profile to get hired by buyers.
            </p>
            <button
              type="button"
              onClick={() => router.push("/dealers")}
              className="px-5 py-2.5 rounded-2xl bg-[var(--copper-600)] text-white text-xs font-bold shadow-md hover:bg-[var(--copper-700)]"
            >
              Browse Dealer Marketplace
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Project Metrics Summary Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Budget */}
              <div className="bg-[var(--paper-raised)] p-5 rounded-3xl border border-[var(--stone-line)] shadow-sm space-y-1">
                <p className="text-[10px] font-bold text-[var(--ink-soft)] uppercase tracking-wider">Total Project Budget</p>
                <p className="text-xl font-black text-[var(--ink)]">₹{budget.toLocaleString()}</p>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-[var(--copper-700)] pt-1">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{projectDetails.project_type.toUpperCase()}</span>
                </div>
              </div>

              {/* Amount Spent */}
              <div className="bg-[var(--paper-raised)] p-5 rounded-3xl border border-[var(--stone-line)] shadow-sm space-y-1">
                <p className="text-[10px] font-bold text-[var(--ink-soft)] uppercase tracking-wider">Amount Spent</p>
                <p className="text-xl font-black text-rose-600">₹{spent.toLocaleString()}</p>
                <p className="text-[11px] font-semibold text-[var(--ink-soft)] pt-1">
                  {budget > 0 ? ((spent / budget) * 100).toFixed(1) : 0}% of budget utilized
                </p>
              </div>

              {/* Remaining Amount */}
              <div className="bg-[var(--paper-raised)] p-5 rounded-3xl border border-[var(--stone-line)] shadow-sm space-y-1">
                <p className="text-[10px] font-bold text-[var(--ink-soft)] uppercase tracking-wider">Remaining Budget</p>
                <p className="text-xl font-black text-emerald-600">₹{remaining.toLocaleString()}</p>
                <p className="text-[11px] font-semibold text-[var(--ink-soft)] pt-1">Safe capital balance</p>
              </div>

              {/* Progress % */}
              <div className="bg-[var(--paper-raised)] p-5 rounded-3xl border border-[var(--stone-line)] shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-[var(--ink-soft)] uppercase tracking-wider">Site Completion</p>
                  <span className="text-xs font-extrabold text-[var(--copper-700)]">{progressPct}%</span>
                </div>
                <div className="w-full bg-[var(--paper)] h-3 rounded-full overflow-hidden border border-[var(--stone-line)]">
                  <div
                    className="bg-gradient-to-r from-[var(--copper-500)] to-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="text-[10px] font-semibold text-[var(--ink-soft)]">
                  Target Date: {projectDetails.target_completion_date}
                </p>
              </div>
            </div>

            {/* Dashboard Tabs Bar */}
            <div className="flex items-center gap-2 border-b border-[var(--stone-line)] pb-3 overflow-x-auto">
              {[
                { id: "overview", label: "Overview & Details", icon: PieChart },
                { id: "milestones", label: `Milestones (${projectDetails.milestones?.length || 0})`, icon: TrendingUp },
                { id: "updates", label: `Progress Logs (${projectDetails.updates?.length || 0})`, icon: Clock },
                { id: "expenses", label: `Invoices & Expenses (${projectDetails.expenses?.length || 0})`, icon: DollarSign },
                { id: "chat", label: `Buyer Project Chat (${projectDetails.messages?.length || 0})`, icon: MessageSquare },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                      activeTab === tab.id
                        ? "bg-[var(--ink)] text-white shadow"
                        : "bg-[var(--paper-raised)] text-[var(--ink-soft)] hover:bg-[var(--paper)] border border-[var(--stone-line)]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[var(--paper-raised)] p-6 rounded-3xl border border-[var(--stone-line)] space-y-4">
                  <h3 className="font-extrabold text-base text-[var(--ink)]">Project Specification</h3>
                  <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
                    {projectDetails.description || "No specific detailed scope notes provided for this construction project."}
                  </p>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--stone-line)] text-xs">
                    <div>
                      <span className="font-bold text-[var(--ink-soft)] block">City & Location</span>
                      <span className="font-semibold text-[var(--ink)]">{projectDetails.city || "Lucknow"}</span>
                    </div>
                    <div>
                      <span className="font-bold text-[var(--ink-soft)] block">Start Date</span>
                      <span className="font-semibold text-[var(--ink)]">{projectDetails.start_date}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[var(--paper-raised)] p-6 rounded-3xl border border-[var(--stone-line)] space-y-4">
                  <h3 className="font-extrabold text-base text-[var(--ink)]">Quick Actions</h3>
                  <button
                    type="button"
                    onClick={() => setExpenseModalOpen(true)}
                    className="w-full py-3 rounded-2xl bg-[var(--copper-600)] text-white text-xs font-bold shadow-md hover:bg-[var(--copper-700)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Invoice / Expense</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("updates")}
                    className="w-full py-3 rounded-2xl bg-[var(--paper)] text-[var(--ink)] border border-[var(--stone-line)] text-xs font-bold hover:bg-[var(--copper-50)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-[var(--copper-600)]" />
                    <span>Log Site Progress Update</span>
                  </button>
                </div>
              </div>
            )}

            {/* Milestones Tab */}
            {activeTab === "milestones" && (
              <div className="bg-[var(--paper-raised)] p-6 rounded-3xl border border-[var(--stone-line)] space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-[var(--ink)]">Construction Phases & Milestones</h3>
                </div>

                <div className="space-y-4">
                  {projectDetails.milestones?.map((m: any, idx: number) => (
                    <div key={m.id || idx} className="p-5 rounded-2xl bg-[var(--paper)] border border-[var(--stone-line)] space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--copper-700)]">
                            Target: {m.target_date}
                          </span>
                          <h4 className="font-bold text-sm text-[var(--ink)] mt-0.5">{m.title}</h4>
                          <p className="text-xs text-[var(--ink-soft)] mt-1">{m.description}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-extrabold text-[var(--copper-700)]">{m.progress_pct || 0}%</span>
                          <p className="text-[11px] font-semibold text-[var(--ink-soft)] mt-0.5">
                            Budget: ₹{(m.budget_allocated || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[var(--copper-600)] h-full rounded-full transition-all"
                          style={{ width: `${m.progress_pct || 0}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2 text-xs">
                        <span className={`font-bold px-2.5 py-0.5 rounded-full ${
                          m.progress_pct >= 100
                            ? "bg-emerald-100 text-emerald-800"
                            : m.progress_pct > 0
                            ? "bg-amber-100 text-amber-800"
                            : "bg-stone-100 text-stone-600"
                        }`}>
                          {m.progress_pct >= 100 ? "Completed" : m.progress_pct > 0 ? "In Progress" : "Pending"}
                        </span>

                        {m.progress_pct < 100 && (
                          <button
                            type="button"
                            onClick={() => handleUpdateMilestone(m.id, m.progress_pct || 0)}
                            className="px-3 py-1 rounded-xl bg-[var(--copper-600)] hover:bg-[var(--copper-700)] text-white font-bold text-[11px] transition-all cursor-pointer"
                          >
                            + Add 25% Progress
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Updates Tab */}
            {activeTab === "updates" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form to log update */}
                <form onSubmit={handlePostUpdate} className="bg-[var(--paper-raised)] p-6 rounded-3xl border border-[var(--stone-line)] space-y-4">
                  <h3 className="font-extrabold text-base text-[var(--ink)]">Log Site Progress Update</h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-[var(--ink)] mb-1">Update Title</label>
                      <input
                        type="text"
                        value={updateTitle}
                        onChange={(e) => setUpdateTitle(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--stone-line)] font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[var(--ink)] mb-1">Progress Increase (+%)</label>
                      <input
                        type="number"
                        value={progressDelta}
                        onChange={(e) => setProgressDelta(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--stone-line)] font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[var(--ink)] mb-1">Site Notes & Status *</label>
                      <textarea
                        value={updateNotes}
                        onChange={(e) => setUpdateNotes(e.target.value)}
                        rows={4}
                        placeholder="Log work completed today, labor count, materials delivered, footings casted..."
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--stone-line)] font-semibold"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={submittingUpdate}
                    className="w-full py-3 rounded-2xl bg-[var(--copper-600)] hover:bg-[var(--copper-700)] text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {submittingUpdate ? "Posting Log..." : "Post Progress Log"}
                  </button>
                </form>

                {/* List of site updates */}
                <div className="lg:col-span-2 bg-[var(--paper-raised)] p-6 rounded-3xl border border-[var(--stone-line)] space-y-4">
                  <h3 className="font-extrabold text-base text-[var(--ink)]">Progress Updates Timeline</h3>
                  <div className="space-y-4">
                    {projectDetails.updates?.length === 0 ? (
                      <p className="text-xs text-[var(--ink-soft)] text-center py-8">No progress updates logged yet.</p>
                    ) : (
                      projectDetails.updates?.map((u: any, idx: number) => (
                        <div key={u.id || idx} className="p-4 rounded-2xl bg-[var(--paper)] border border-[var(--stone-line)] space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[var(--ink)]">{u.title}</span>
                            <span className="text-[11px] font-semibold text-[var(--ink-soft)]">{u.log_date}</span>
                          </div>
                          <p className="text-xs text-[var(--ink-soft)] leading-relaxed">{u.notes}</p>
                          {u.progress_delta > 0 && (
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                              +{u.progress_delta}% Overall Progress
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Expenses Tab */}
            {activeTab === "expenses" && (
              <div className="bg-[var(--paper-raised)] p-6 rounded-3xl border border-[var(--stone-line)] space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-[var(--ink)]">Project Expense & Invoice Records</h3>
                  <button
                    type="button"
                    onClick={() => setExpenseModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[var(--copper-600)] hover:bg-[var(--copper-700)] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Upload Expense / Invoice</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {projectDetails.expenses?.length === 0 ? (
                    <p className="text-xs text-[var(--ink-soft)] text-center py-8">No expense invoices uploaded yet.</p>
                  ) : (
                    projectDetails.expenses?.map((e: any, idx: number) => (
                      <div key={e.id || idx} className="p-4 rounded-2xl bg-[var(--paper)] border border-[var(--stone-line)] flex items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[var(--copper-100)] text-[var(--copper-700)] flex items-center justify-center font-bold">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-[var(--ink)]">{e.title}</p>
                            <p className="text-[11px] font-semibold text-[var(--ink-soft)]">
                              Category: {e.category.toUpperCase()} • Vendor: {e.vendor || "N/A"} • Date: {e.expense_date}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-sm text-[var(--copper-700)]">₹{Number(e.amount || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Chat Tab */}
            {activeTab === "chat" && (
              <div className="bg-[var(--paper-raised)] p-6 rounded-3xl border border-[var(--stone-line)] space-y-4">
                <h3 className="font-extrabold text-base text-[var(--ink)]">Buyer ↔ Dealer Direct Messaging</h3>
                <div className="h-80 overflow-y-auto p-4 rounded-2xl bg-[var(--paper)] border border-[var(--stone-line)] space-y-3">
                  {projectDetails.messages?.length === 0 ? (
                    <p className="text-xs text-[var(--ink-soft)] text-center py-12">No messages sent yet. Start the conversation with the buyer.</p>
                  ) : (
                    projectDetails.messages?.map((m: any, idx: number) => (
                      <div key={m.id || idx} className={`flex flex-col ${m.sender_role === "dealer" ? "items-end" : "items-start"}`}>
                        <span className="text-[10px] font-semibold text-[var(--ink-soft)] px-1">
                          {m.sender_name} ({m.sender_role})
                        </span>
                        <div className={`p-3 rounded-2xl text-xs max-w-md ${
                          m.sender_role === "dealer"
                            ? "bg-[var(--copper-600)] text-white"
                            : "bg-stone-200 text-stone-900"
                        }`}>
                          {m.message}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type project update or answer buyer query..."
                    className="flex-1 px-4 py-2.5 rounded-2xl bg-[var(--paper)] border border-[var(--stone-line)] text-xs font-semibold focus:outline-none focus:border-[var(--copper-600)]"
                  />
                  <button
                    type="submit"
                    disabled={sendingMsg}
                    className="px-5 py-2.5 rounded-2xl bg-[var(--copper-600)] hover:bg-[var(--copper-700)] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Upload Expense Modal */}
      {expenseModalOpen && (
        <div className="fixed inset-0 z-[9999999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--paper-raised)] rounded-3xl border border-[var(--stone-line)] w-full max-w-lg p-6 space-y-5">
            <h3 className="font-extrabold text-base text-[var(--ink)]">Log Project Invoice / Expense</h3>

            <form onSubmit={handlePostExpense} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[var(--ink)] mb-1">Expense Title *</label>
                <input
                  type="text"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="e.g. Cement & Rebar Supply Invoice #402"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--stone-line)] font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[var(--ink)] mb-1">Category</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--stone-line)] font-bold"
                  >
                    <option value="invoice">Supplier Invoice</option>
                    <option value="receipt">Material Receipt</option>
                    <option value="photo">Site Photo</option>
                    <option value="permit">Municipal Permit</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[var(--ink)] mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="150000"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--stone-line)] font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[var(--ink)] mb-1">Vendor / Supplier Name</label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="e.g. Ultratech Cement Suppliers"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--stone-line)] font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--ink-soft)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingExpense}
                  className="px-5 py-2 rounded-xl bg-[var(--copper-600)] text-white text-xs font-bold"
                >
                  {submittingExpense ? "Logging..." : "Log Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
