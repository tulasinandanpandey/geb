"use client";

import { useState } from "react";
import {
  Sparkles,
  Building2,
  Sprout,
  TrendingUp,
  Wind,
  Bot,
  Send,
  Loader2,
  MessageSquare,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  Compass,
  FileText,
  MapPin,
  ExternalLink,
  Layers,
  ChevronDown,
} from "lucide-react";
import {
  SoilAnalysis,
  LandGrowthAnalysis,
  AirIntelligenceAnalysis,
  CombinerAnalysis,
  BuilderFeasibilityAnalysis,
  querySoilAgent,
  queryGrowthAgent,
  queryAirAgent,
  queryCombinerAgent,
  queryBuilderAgent,
} from "@/services/landAnalysis";
import CombinerReportCard from "./CombinerReportCard";
import BuilderFeasibilityCard from "./BuilderFeasibilityCard";
import SoilAnalysisCard from "./SoilAnalysisCard";
import LandGrowthCard from "./LandGrowthCard";
import AirIntelligenceCard from "./AirIntelligenceCard";

interface LandAnalysisFullReportProps {
  soilAnalysis: SoilAnalysis | null;
  growthAnalysis: LandGrowthAnalysis | null;
  airAnalysis: AirIntelligenceAnalysis | null;
  combinerAnalysis: CombinerAnalysis | null;
  builderAnalysis: BuilderFeasibilityAnalysis | null;
  title?: string;
  locationLabel?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  agent: "combiner" | "builder" | "soil" | "growth" | "air";
  content: string;
  timestamp: string;
}

export default function LandAnalysisFullReport({
  soilAnalysis,
  growthAnalysis,
  airAnalysis,
  combinerAnalysis,
  builderAnalysis,
  title = "Comprehensive Land & Architectural GIS Intelligence Report",
  locationLabel,
}: LandAnalysisFullReportProps) {
  const [activeTab, setActiveTab] = useState<
    "all" | "combiner" | "builder" | "soil" | "growth" | "air" | "ask"
  >("all");

  const [activeAgent, setActiveAgent] = useState<
    "combiner" | "builder" | "soil" | "growth" | "air"
  >("combiner");

  const [inputMessage, setInputMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);

  if (!combinerAnalysis && !soilAnalysis) {
    return (
      <div className="bg-white border border-[var(--stone-line)] rounded-3xl p-12 text-center text-[var(--ink-soft)] space-y-4 shadow-sm">
        <Compass className="w-12 h-12 text-orange-500 mx-auto animate-pulse" />
        <h3 className="text-lg font-extrabold text-[var(--ink)]">No Land Parcel Selected Yet</h3>
        <p className="text-xs max-w-md mx-auto">
          Select a land listing on the GIS map above or click anywhere on the map to run the 5-Agent Autonomous Intelligence Suite.
        </p>
      </div>
    );
  }

  const propertyTitle =
    title ||
    soilAnalysis?.property_title ||
    combinerAnalysis?.property_title ||
    "Selected Parcel Analysis";

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isQuerying) return;

    const userText = inputMessage.trim();
    const currentAgent = activeAgent;
    const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setInputMessage("");
    setChatHistory((prev) => [
      ...prev,
      { role: "user", agent: currentAgent, content: userText, timestamp: nowStr },
    ]);
    setIsQuerying(true);

    try {
      let response = "";
      if (currentAgent === "combiner" && combinerAnalysis) {
        response = await queryCombinerAgent({
          message: userText,
          analysis: combinerAnalysis,
          conversation_history: chatHistory.map((m) => ({ role: m.role, content: m.content })),
        });
      } else if (currentAgent === "builder" && builderAnalysis) {
        response = await queryBuilderAgent({
          message: userText,
          analysis: builderAnalysis,
          conversation_history: chatHistory.map((m) => ({ role: m.role, content: m.content })),
        });
      } else if (currentAgent === "soil" && soilAnalysis) {
        response = await querySoilAgent({
          message: userText,
          analysis: soilAnalysis,
          conversation_history: chatHistory.map((m) => ({ role: m.role, content: m.content })),
        });
      } else if (currentAgent === "growth" && growthAnalysis) {
        response = await queryGrowthAgent({
          message: userText,
          analysis: growthAnalysis,
          conversation_history: chatHistory.map((m) => ({ role: m.role, content: m.content })),
        });
      } else if (currentAgent === "air" && airAnalysis) {
        response = await queryAirAgent({
          message: userText,
          analysis: airAnalysis,
          conversation_history: chatHistory.map((m) => ({ role: m.role, content: m.content })),
        });
      } else {
        response = "Requested agent analysis state is unavailable for this property.";
      }

      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", agent: currentAgent, content: response, timestamp: nowStr },
      ]);
    } catch (err) {
      console.error("Agent query failed:", err);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          agent: currentAgent,
          content: "Unable to query agent co-pilot at this time.",
          timestamp: nowStr,
        },
      ]);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleQuickPrompt = (
    promptText: string,
    agentType: "combiner" | "builder" | "soil" | "growth" | "air"
  ) => {
    setActiveAgent(agentType);
    setInputMessage(promptText);
    setActiveTab("ask");

    // Scroll to ask section
    const askEl = document.getElementById("ask-ai-section");
    if (askEl) {
      askEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div id="report-section" className="w-full space-y-8 text-[var(--ink)] font-sans">
      {/* Top Banner & Title Bar */}
      <div className="bg-gradient-to-br from-white via-orange-50/30 to-amber-50/20 border border-[var(--stone-line)] rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3.5 py-1 rounded-full text-xs font-extrabold bg-orange-600 text-white shadow-sm flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>GEB 5-Agent Comprehensive Synthesis</span>
              </span>
              {locationLabel && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-[var(--ink-soft)] border border-[var(--stone-line)] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-orange-600" />
                  <span>{locationLabel}</span>
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] tracking-tight">
              {propertyTitle}
            </h2>

            <p className="text-xs sm:text-sm text-[var(--ink-soft)] font-medium leading-relaxed">
              Full-width multi-agent GIS intelligence synthesis integrating Geotechnical Soil Bearing Capacity, Builder FAR Feasibility, Satellite Growth Trends, Environmental AQI, and Investment Suitability.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setActiveTab("ask");
                const el = document.getElementById("ask-ai-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs transition-all shadow-lg cursor-pointer border border-white/20"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ask AI Co-Pilot Questions</span>
            </button>
          </div>
        </div>

        {/* Quick Agent Prompt Pills */}
        <div className="mt-6 pt-6 border-t border-[var(--stone-line)] flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
          <span className="text-[11px] text-[var(--ink-soft)] font-extrabold shrink-0 uppercase tracking-wider">
            Quick Analysis Questions:
          </span>
          <button
            onClick={() => handleQuickPrompt("What is the maximum FAR built-up square footage allowed?", "builder")}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-orange-50 text-indigo-700 border border-indigo-200 shrink-0 transition-colors shadow-sm cursor-pointer"
          >
            🏢 FAR & Max Floors
          </button>
          <button
            onClick={() => handleQuickPrompt("What foundation depth & type is recommended for this soil bearing capacity?", "soil")}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-orange-50 text-emerald-700 border border-emerald-200 shrink-0 transition-colors shadow-sm cursor-pointer"
          >
            🌱 Foundation & Soil Bearing
          </button>
          <button
            onClick={() => handleQuickPrompt("What is the projected 5-year price appreciation velocity?", "growth")}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-orange-50 text-purple-700 border border-purple-200 shrink-0 transition-colors shadow-sm cursor-pointer"
          >
            📈 5-Yr Growth Velocity
          </button>
          <button
            onClick={() => handleQuickPrompt("Is the AQI and environmental buffer favorable for long term residence?", "air")}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-orange-50 text-cyan-700 border border-cyan-200 shrink-0 transition-colors shadow-sm cursor-pointer"
          >
            💨 Environmental AQI
          </button>
        </div>
      </div>

      {/* Navigation Tabs for Views */}
      <div className="flex items-center justify-between border-b border-[var(--stone-line)] pb-2 overflow-x-auto gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "all"
                ? "bg-[var(--ink)] text-white shadow-md"
                : "bg-white text-[var(--ink-soft)] hover:bg-[var(--paper)] border border-[var(--stone-line)]"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Full Comprehensive View (All 5 Reports)</span>
          </button>

          <button
            onClick={() => setActiveTab("combiner")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "combiner"
                ? "bg-orange-600 text-white shadow-md"
                : "bg-white text-orange-800 hover:bg-orange-50 border border-orange-200"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Combiner Synthesis</span>
          </button>

          <button
            onClick={() => setActiveTab("builder")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "builder"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-white text-indigo-800 hover:bg-indigo-50 border border-indigo-200"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Builder FAR</span>
          </button>

          <button
            onClick={() => setActiveTab("soil")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "soil"
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200"
            }`}
          >
            <Sprout className="w-4 h-4" />
            <span>Soil Geotechnical</span>
          </button>

          <button
            onClick={() => setActiveTab("growth")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "growth"
                ? "bg-purple-600 text-white shadow-md"
                : "bg-white text-purple-800 hover:bg-purple-50 border border-purple-200"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Satellite Growth</span>
          </button>

          <button
            onClick={() => setActiveTab("air")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "air"
                ? "bg-cyan-600 text-white shadow-md"
                : "bg-white text-cyan-800 hover:bg-cyan-50 border border-cyan-200"
            }`}
          >
            <Wind className="w-4 h-4" />
            <span>Air & Environment</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("ask");
              const el = document.getElementById("ask-ai-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "ask"
                ? "bg-amber-600 text-white shadow-md"
                : "bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100"
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Ask AI Co-Pilot</span>
          </button>
        </div>
      </div>

      {/* Main Full-Width Report Content */}
      <div className="space-y-8">
        {(activeTab === "all" || activeTab === "combiner") && combinerAnalysis && (
          <div className="w-full">
            <CombinerReportCard combiner={combinerAnalysis} />
          </div>
        )}

        {(activeTab === "all" || activeTab === "builder") && builderAnalysis && (
          <div className="w-full">
            <BuilderFeasibilityCard builder={builderAnalysis} />
          </div>
        )}

        {(activeTab === "all" || activeTab === "soil") && soilAnalysis && (
          <div className="w-full">
            <SoilAnalysisCard analysis={soilAnalysis} />
          </div>
        )}

        {(activeTab === "all" || activeTab === "growth") && growthAnalysis && (
          <div className="w-full">
            <LandGrowthCard growth={growthAnalysis} />
          </div>
        )}

        {(activeTab === "all" || activeTab === "air") && airAnalysis && (
          <div className="w-full">
            <AirIntelligenceCard air={airAnalysis} />
          </div>
        )}
      </div>

      {/* Embedded Full-Width AI Co-Pilot Question Assistant Section */}
      <div
        id="ask-ai-section"
        className="bg-white border border-orange-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 relative overflow-hidden"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--stone-line)] pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 border border-orange-300 flex items-center justify-center text-orange-700 shadow-sm">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-[var(--ink)]">
                  GEB Autonomous Co-Pilot & Question Assistant
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-800 border border-orange-200">
                  Interactive AI
                </span>
              </div>
              <p className="text-xs text-[var(--ink-soft)] font-medium mt-0.5">
                Ask targeted questions to any of the 5 autonomous GIS agents about this land parcel.
              </p>
            </div>
          </div>

          {/* Active Agent Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--ink-soft)] hidden sm:inline">Target AI Agent:</span>
            <select
              value={activeAgent}
              onChange={(e) => setActiveAgent(e.target.value as any)}
              className="bg-[var(--paper)] text-xs font-extrabold text-[var(--ink)] py-2 px-4 rounded-xl border border-[var(--stone-line)] outline-none cursor-pointer focus:border-orange-600 shadow-sm"
            >
              <option value="combiner">Combiner Deep Advisor</option>
              <option value="builder">Builder Development Advisor</option>
              <option value="soil">Soil & Geotechnical Agent</option>
              <option value="growth">Land Growth Agent</option>
              <option value="air">Air Intelligence Agent</option>
            </select>
          </div>
        </div>

        {/* Chat Threads Container */}
        <div className="bg-[var(--paper)]/60 border border-[var(--stone-line)] rounded-2xl p-5 min-h-[300px] max-h-[500px] overflow-y-auto space-y-4 shadow-inner">
          {chatHistory.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <Sparkles className="w-10 h-10 mx-auto text-orange-500 animate-pulse" />
              <p className="text-sm font-extrabold text-[var(--ink)]">
                Ask your question about this parcel's engineering, growth, or legal constraints.
              </p>
              <p className="text-xs text-[var(--ink-soft)] max-w-lg mx-auto font-medium">
                Example: "What foundation should I build on 186 kN/m² soil?", "Can I construct 4 floors?", or "What is the 5-year ROI forecast?"
              </p>

              <div className="flex flex-wrap justify-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => handleQuickPrompt("What foundation type is required for this bearing capacity?", "soil")}
                  className="px-3 py-1.5 rounded-full bg-white border border-[var(--stone-line)] text-xs font-semibold hover:border-orange-400 text-[var(--ink)] shadow-sm cursor-pointer"
                >
                  Foundation Type
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPrompt("Calculate total buildable area and FAR floors allowed.", "builder")}
                  className="px-3 py-1.5 rounded-full bg-white border border-[var(--stone-line)] text-xs font-semibold hover:border-orange-400 text-[var(--ink)] shadow-sm cursor-pointer"
                >
                  FAR & Coverage
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPrompt("What are the main risks or uncertainty disclosures for this land?", "combiner")}
                  className="px-3 py-1.5 rounded-full bg-white border border-[var(--stone-line)] text-xs font-semibold hover:border-orange-400 text-[var(--ink)] shadow-sm cursor-pointer"
                >
                  Risk Disclosures
                </button>
              </div>
            </div>
          ) : (
            chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white font-medium"
                      : "bg-white border border-[var(--stone-line)] text-[var(--ink)] font-normal"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1.5 text-[10px] font-extrabold uppercase opacity-90">
                    <span className="flex items-center gap-1">
                      {msg.role === "user" ? (
                        "You"
                      ) : (
                        <>
                          <Bot className="w-3 h-3 text-orange-600" />
                          <span>{msg.agent.toUpperCase()} AGENT</span>
                        </>
                      )}
                    </span>
                    <span className="text-[9px] font-normal">{msg.timestamp}</span>
                  </div>
                  <p className="whitespace-pre-line font-sans">{msg.content}</p>
                </div>
              </div>
            ))
          )}

          {isQuerying && (
            <div className="flex items-center gap-3 text-orange-700 text-xs font-bold p-3 bg-orange-50 rounded-2xl border border-orange-200">
              <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
              <span>Synthesizing multi-agent GIS response...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Ask ${activeAgent.toUpperCase()} Agent any question about this property...`}
            className="flex-1 bg-[var(--paper)] border border-[var(--stone-line)] rounded-2xl px-5 py-3.5 text-xs sm:text-sm font-medium outline-none focus:border-orange-600 focus:bg-white shadow-sm text-[var(--ink)] transition-all"
          />
          <button
            type="submit"
            disabled={isQuerying || !inputMessage.trim()}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs sm:text-sm transition-all shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Ask Agent</span>
          </button>
        </form>
      </div>
    </div>
  );
}
