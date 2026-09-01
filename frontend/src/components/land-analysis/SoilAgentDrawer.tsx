"use client";

import { useState } from "react";
import {
  X,
  Bot,
  Send,
  Loader2,
  FileText,
  Activity,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Wind,
  Sprout,
  Building2,
  Compass,
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
import SoilAnalysisCard from "./SoilAnalysisCard";
import LandGrowthCard from "./LandGrowthCard";
import AirIntelligenceCard from "./AirIntelligenceCard";
import CombinerReportCard from "./CombinerReportCard";
import BuilderFeasibilityCard from "./BuilderFeasibilityCard";

interface MultiAgentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  soilAnalysis: SoilAnalysis | null;
  growthAnalysis: LandGrowthAnalysis | null;
  airAnalysis: AirIntelligenceAnalysis | null;
  combinerAnalysis: CombinerAnalysis | null;
  builderAnalysis: BuilderFeasibilityAnalysis | null;
}

interface ChatMessage {
  role: "user" | "assistant";
  agent: "combiner" | "builder" | "soil" | "growth" | "air";
  content: string;
}

export default function SoilAgentDrawer({
  isOpen,
  onClose,
  soilAnalysis,
  growthAnalysis,
  airAnalysis,
  combinerAnalysis,
  builderAnalysis,
}: MultiAgentDrawerProps) {
  const [activeTab, setActiveTab] = useState<
    "combiner" | "builder" | "soil" | "growth" | "air" | "co-pilot"
  >("combiner");
  const [activeAgent, setActiveAgent] = useState<
    "combiner" | "builder" | "soil" | "growth" | "air"
  >("combiner");
  const [inputMessage, setInputMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);

  if (!isOpen) return null;

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isQuerying) return;

    const userText = inputMessage.trim();
    const currentAgent = activeAgent;
    setInputMessage("");
    setChatHistory((prev) => [...prev, { role: "user", agent: currentAgent, content: userText }]);
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
        response = "Requested agent analysis state unavailable for this property.";
      }

      setChatHistory((prev) => [...prev, { role: "assistant", agent: currentAgent, content: response }]);
    } catch (err) {
      console.error("Agent query failed:", err);
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", agent: currentAgent, content: "Unable to query agent co-pilot at this time." },
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
    setActiveTab("co-pilot");
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white/95 backdrop-blur-2xl text-[var(--ink)] border-l border-[var(--stone-line)] shadow-2xl flex flex-col transition-all transform animate-in slide-in-from-right duration-300 font-sans">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--stone-line)] flex items-center justify-between bg-white/90">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-700 shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-[var(--ink)]">GEB Autonomous Intelligence Drawer</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-800 border border-orange-200">
                5 AI Agents Active
              </span>
            </div>
            <p className="text-xs text-[var(--ink-soft)] font-medium mt-0.5">
              {soilAnalysis?.property_title || "Sampled Land Parcel"}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--paper)] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-[var(--stone-line)] px-4 bg-[var(--paper)]/80 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab("combiner")}
          className={`flex items-center gap-1.5 px-3 py-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "combiner"
              ? "border-orange-600 text-orange-700 font-extrabold"
              : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Combiner Advisor</span>
        </button>

        <button
          onClick={() => setActiveTab("builder")}
          className={`flex items-center gap-1.5 px-3 py-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "builder"
              ? "border-indigo-600 text-indigo-700 font-extrabold"
              : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Builder Development</span>
        </button>

        <button
          onClick={() => setActiveTab("soil")}
          className={`flex items-center gap-1.5 px-3 py-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "soil"
              ? "border-emerald-600 text-emerald-700 font-extrabold"
              : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
          }`}
        >
          <Sprout className="w-4 h-4" />
          <span>Soil Geotechnical</span>
        </button>

        <button
          onClick={() => setActiveTab("growth")}
          className={`flex items-center gap-1.5 px-3 py-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "growth"
              ? "border-purple-600 text-purple-700 font-extrabold"
              : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Satellite Growth</span>
        </button>

        <button
          onClick={() => setActiveTab("air")}
          className={`flex items-center gap-1.5 px-3 py-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "air"
              ? "border-cyan-600 text-cyan-700 font-extrabold"
              : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
          }`}
        >
          <Wind className="w-4 h-4" />
          <span>Air & Environment</span>
        </button>

        <button
          onClick={() => setActiveTab("co-pilot")}
          className={`flex items-center gap-1.5 px-3 py-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "co-pilot"
              ? "border-orange-600 text-orange-700 font-extrabold"
              : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>AI Co-Pilot Chat</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[var(--paper)]/50">
        {activeTab === "combiner" && combinerAnalysis && (
          <CombinerReportCard
            combiner={combinerAnalysis}
          />
        )}

        {activeTab === "builder" && builderAnalysis && (
          <BuilderFeasibilityCard
            builder={builderAnalysis}
          />
        )}

        {activeTab === "soil" && soilAnalysis && (
          <SoilAnalysisCard
            analysis={soilAnalysis}
          />
        )}

        {activeTab === "growth" && growthAnalysis && (
          <LandGrowthCard
            growth={growthAnalysis}
          />
        )}

        {activeTab === "air" && airAnalysis && (
          <AirIntelligenceCard
            air={airAnalysis}
          />
        )}

        {activeTab === "co-pilot" && (
          <div className="space-y-4 flex flex-col h-full">
            {/* Agent Switcher */}
            <div className="bg-white border border-[var(--stone-line)] p-3 rounded-2xl flex items-center justify-between shadow-sm">
              <span className="text-xs font-bold text-[var(--ink-soft)]">Select Target AI Advisor:</span>
              <select
                value={activeAgent}
                onChange={(e) => setActiveAgent(e.target.value as any)}
                className="bg-[var(--paper)] text-xs font-extrabold text-[var(--ink)] py-1.5 px-3 rounded-xl border border-[var(--stone-line)] outline-none cursor-pointer"
              >
                <option value="combiner">Combiner Deep Advisor</option>
                <option value="builder">Builder Development Advisor</option>
                <option value="soil">Soil & Geotechnical Agent</option>
                <option value="growth">Land Growth Agent</option>
                <option value="air">Air Intelligence Agent</option>
              </select>
            </div>

            {/* Conversation Log */}
            <div className="flex-1 bg-white border border-[var(--stone-line)] rounded-2xl p-4 overflow-y-auto min-h-[350px] space-y-3 shadow-inner">
              {chatHistory.length === 0 ? (
                <div className="text-center text-[var(--ink-soft)] text-xs py-12 space-y-2">
                  <Bot className="w-8 h-8 mx-auto text-orange-600" />
                  <p className="font-bold text-[var(--ink-soft)]">Ask any question to the active GEB AI Agent.</p>
                  <p className="text-[11px] text-[var(--ink-soft)] max-w-xs mx-auto">
                    Try asking about foundation recommendations, FAR buildable sqft, 5-year growth rates, or winter air quality trends.
                  </p>
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
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-orange-600 text-white font-medium"
                          : "bg-[var(--paper)] border border-[var(--stone-line)] text-[var(--ink)] font-normal"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 opacity-80 text-[10px] font-bold uppercase">
                        <span>{msg.role === "user" ? "You" : `${msg.agent.toUpperCase()} AGENT`}</span>
                      </div>
                      <p className="whitespace-pre-line">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}

              {isQuerying && (
                <div className="flex items-center gap-2 text-orange-700 text-xs font-bold p-2 bg-orange-50 rounded-xl border border-orange-100">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing multi-sensor intelligence...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Ask ${activeAgent.toUpperCase()} Agent...`}
                className="flex-1 bg-white border border-[var(--stone-line)] rounded-2xl px-4 py-3 text-xs font-medium outline-none focus:border-orange-600 shadow-sm text-[var(--ink)]"
              />
              <button
                type="submit"
                disabled={isQuerying || !inputMessage.trim()}
                className="px-5 py-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
