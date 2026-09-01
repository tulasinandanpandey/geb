"use client";

import {
  ArrowRight,
  Bot,
  Loader2,
  Send,
  Sparkles,
  X,
} from "lucide-react";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

interface AIProperty {
  id: string;
  title: string;
  property_type: string;
  price: number;
  area?: number;
  area_unit?: "sqft" | "sqm";
  city: string;
  locality?: string;
  latitude: number;
  longitude: number;
  image?: string;
  images?: string[];
  source: "geb" | "external" | "broker";
  source_name?: string;
  source_url?: string;
  investment_score?: number;
  featured?: boolean;
  status?: string;
  description?: string;
  seller_id?: string;
  created_at?: string;
  updated_at?: string;
  geb_match_score?: number;
  geb_score_breakdown?: {
    geb_match_score?: number;
    budget_fit?: number;
    investment_fit?: number;
    location_fit?: number;
    property_type_fit?: number;
    area_fit?: number;
    priority_fit?: number;
    risk_fit?: number;
    horizon_fit?: number;
  };
}

interface AIResponse {
  success: boolean;
  answer: string;
  count: number;
  properties: AIProperty[];
  interpreted_requirements?: {
    city?: string | null;
    locality?: string | null;
    property_type?: string | null;
    min_price?: number | null;
    max_price?: number | null;
    purpose?: string | null;
    priority?: string | null;
    risk_preference?: string | null;
    time_horizon_years?: number | null;
  };
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  properties?: AIProperty[];
}

interface GEBAIChatProps {
  open: boolean;
  onClose: () => void;
  onPropertySelect: (property: AIProperty) => void;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

const suggestions = [
  "2BHK flat for rent under ₹25k in Lucknow",
  "Furnished house for rent in Lucknow",
  "Find plots in Lucknow under 50 lakh",
  "I want long-term investment in Lucknow",
];

function formatPrice(property: { price: number; listing_type?: string; monthly_rent?: number; title?: string }) {
  const isRent = property.listing_type === "rent" || (property.title && property.title.toLowerCase().includes("rent"));
  const priceVal = property.monthly_rent || property.price;

  if (isRent) {
    if (priceVal >= 100000) {
      return `₹${(priceVal / 100000).toFixed(1)} L / month`;
    }
    return `₹${priceVal.toLocaleString("en-IN")} / month`;
  }

  if (priceVal >= 10000000) {
    return `₹${(priceVal / 10000000).toFixed(2)} Cr`;
  }

  return `₹${(priceVal / 100000).toFixed(1)} L`;
}

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function PropertyRecommendation({
  property,
  onPropertySelect,
}: {
  property: AIProperty;
  onPropertySelect: (property: AIProperty) => void;
}) {
  const breakdown = property.geb_score_breakdown;

  return (
    <button
      type="button"
      onClick={() => onPropertySelect(property)}
      className="block w-full overflow-hidden rounded-2xl border border-[var(--stone-line)] bg-white text-left transition hover:-translate-y-0.5 hover:border-[var(--ink-soft)] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--ink)]"
    >
      {property.image && (
        <img
          src={property.image}
          alt={property.title}
          className="h-36 w-full object-cover"
        />
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="font-semibold">
            {property.title}
          </p>

          {property.geb_match_score !== undefined && (
            <span className="shrink-0 rounded-full bg-[var(--ink)] px-2.5 py-1 text-[10px] font-bold text-white">
              GEB {property.geb_match_score}/100
            </span>
          )}
        </div>

        <p className="mt-1 text-xs text-[var(--ink-soft)]">
          {property.locality
            ? `${property.locality}, `
            : ""}
          {property.city}
        </p>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="font-semibold">
            {formatPrice(property)}
          </p>

          <span className="rounded-full bg-[var(--paper)] px-2.5 py-1 text-[10px] font-semibold uppercase">
            {property.property_type}
          </span>
        </div>

        {breakdown && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {breakdown.budget_fit !== undefined && (
              <span className="rounded-full bg-[var(--paper)] px-2 py-1 text-[9px] font-medium text-[var(--ink-soft)]">
                Budget {breakdown.budget_fit}
              </span>
            )}

            {breakdown.investment_fit !== undefined && (
              <span className="rounded-full bg-[var(--paper)] px-2 py-1 text-[9px] font-medium text-[var(--ink-soft)]">
                Investment {breakdown.investment_fit}
              </span>
            )}

            {breakdown.risk_fit !== undefined && (
              <span className="rounded-full bg-[var(--paper)] px-2 py-1 text-[9px] font-medium text-[var(--ink-soft)]">
                Risk {breakdown.risk_fit}
              </span>
            )}

            {breakdown.horizon_fit !== undefined && (
              <span className="rounded-full bg-[var(--paper)] px-2 py-1 text-[9px] font-medium text-[var(--ink-soft)]">
                Horizon {breakdown.horizon_fit}
              </span>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center gap-1 text-xs font-medium text-[var(--ink-soft)]">
          Click to view property details
          <ArrowRight size={12} />
        </div>
      </div>
    </button>
  );
}

function parseRAGResponse(content: string) {
  const sections: { title: string; body: string }[] = [];
  const parts = content.split(/###\s+/);

  const intro = parts[0].trim();
  if (intro) {
    sections.push({ title: "", body: intro });
  }

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const firstNewlineIndex = part.indexOf("\n");
    if (firstNewlineIndex === -1) {
      sections.push({ title: part.trim(), body: "" });
    } else {
      const title = part.substring(0, firstNewlineIndex).trim();
      const body = part.substring(firstNewlineIndex + 1).trim();
      sections.push({ title, body });
    }
  }

  return sections;
}

function FormattedBody({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  let inList = false;
  let listItems: string[] = [];

  const flushList = (keyPrefix: string) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${keyPrefix}`} className="list-disc pl-5 my-2 space-y-1">
          {listItems.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: formatBold(item) }} />
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const formatBold = (str: string) => {
    return str.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      inList = true;
      listItems.push(trimmed.substring(2));
    } else {
      if (inList) {
        flushList(index.toString());
      }
      if (trimmed) {
        elements.push(
          <p
            key={index}
            className="my-2 text-sm leading-6"
            dangerouslySetInnerHTML={{ __html: formatBold(trimmed) }}
          />
        );
      }
    }
  });

  if (inList) {
    flushList("end");
  }

  return <div className="text-[var(--ink-soft)]">{elements}</div>;
}

function RAGSectionRenderer({ title, body }: { title: string; body: string }) {
  const normalizedTitle = title.toLowerCase();

  if (normalizedTitle === "") {
    return <FormattedBody text={body} />;
  }

  if (normalizedTitle.includes("recommendation") || normalizedTitle.includes("top match")) {
    return (
      <div className="my-4 rounded-2xl border border-emerald-500/20 bg-emerald-50/50 p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full">
            🏆 Direct Recommendation
          </span>
        </div>
        <FormattedBody text={body} />
      </div>
    );
  }

  if (normalizedTitle.includes("why")) {
    return (
      <div className="my-4 rounded-2xl border border-[var(--stone-line)] bg-[var(--paper)]/50 p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-soft)] mb-2">
          🎯 Why It Matches
        </h4>
        <FormattedBody text={body} />
      </div>
    );
  }

  if (normalizedTitle.includes("alternative") || normalizedTitle.includes("other matches")) {
    return (
      <div className="my-4 rounded-2xl border border-[var(--stone-line)] bg-white p-5 shadow-sm">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-soft)] mb-2">
          🔄 Alternative Options
        </h4>
        <FormattedBody text={body} />
      </div>
    );
  }

  if (normalizedTitle.includes("trade-off") || normalizedTitle.includes("tradeoffs")) {
    return (
      <div className="my-4 rounded-2xl border border-amber-500/20 bg-amber-50/40 p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2">
          ⚖️ Trade-offs
        </h4>
        <FormattedBody text={body} />
      </div>
    );
  }

  if (normalizedTitle.includes("missing")) {
    return (
      <div className="my-4 rounded-2xl border border-red-500/20 bg-red-50/40 p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-red-800 mb-2">
          ⚠️ Missing Information
        </h4>
        <FormattedBody text={body} />
      </div>
    );
  }

  if (normalizedTitle.includes("next step") || normalizedTitle.includes("next action")) {
    return (
      <div className="my-4 rounded-2xl border border-orange-500/20 bg-orange-50/40 p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-orange-800 mb-2">
          🚀 Next Step
        </h4>
        <FormattedBody text={body} />
      </div>
    );
  }

  if (normalizedTitle.includes("disclaimer")) {
    return (
      <div className="my-4 border-t border-[var(--stone-line)] pt-3 text-xs leading-5 text-[var(--ink-soft)]">
        <p className="italic">{body}</p>
      </div>
    );
  }

  return (
    <div className="my-4">
      <h4 className="font-semibold text-sm text-[var(--ink)] mb-1">{title}</h4>
      <FormattedBody text={body} />
    </div>
  );
}

export default function GEBAIChat({
  open,
  onClose,
  onPropertySelect,
}: GEBAIChatProps) {
  const [message, setMessage] =
    useState("");

  const [chatHistory, setChatHistory] =
    useState<ChatMessage[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const scrollRef =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [chatHistory, loading, error]);

  async function askAI(event?: FormEvent) {
    event?.preventDefault();

    const question = message.trim();

    if (!question || loading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: question,
    };

    const conversationForRequest =
      chatHistory.map((item) => ({
        role: item.role,
        content: item.content,
      }));

    setChatHistory((current) => [
      ...current,
      userMessage,
    ]);
    setMessage("");
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/ai/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: question,
            conversation: conversationForRequest,
          }),
        }
      );

      const data:
        | AIResponse
        | { detail?: string } =
        await response.json();

      if (!response.ok) {
        throw new Error(
          "detail" in data && data.detail
            ? data.detail
            : "Unable to contact GEB AI."
        );
      }

      const result = data as AIResponse;

      setChatHistory((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "assistant",
          content: result.answer,
          properties: result.properties || [],
        },
      ]);
    } catch (error) {
      console.error(
        "GEB AI request failed:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to contact GEB AI."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[2000]">
      <button
        type="button"
        aria-label="Close GEB AI"
        onClick={onClose}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
      />

      <div className="absolute bottom-0 right-0 h-[92vh] w-full overflow-hidden rounded-t-[2rem] border border-[var(--stone-line)] bg-[var(--paper)] shadow-2xl md:bottom-6 md:right-6 md:h-[760px] md:max-h-[calc(100vh-3rem)] md:w-[520px] md:rounded-[2rem]">
        <div className="flex items-center justify-between border-b border-[var(--stone-line)] bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ink)] text-white">
              <Sparkles size={18} />
            </div>

            <div>
              <p className="font-semibold">
                GEB AI
              </p>

              <p className="text-xs text-[var(--ink-soft)]">
                Your real-estate intelligence agent
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--paper)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex h-[calc(100%-130px)] flex-col overflow-y-auto px-5 py-6">
          {chatHistory.length === 0 &&
            !loading &&
            !error && (
              <div className="m-auto max-w-sm text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <Bot size={25} />
                </div>

                <h2 className="mt-5 font-display text-3xl font-medium">
                  What should you buy?
                </h2>

                <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                  Ask GEB to find properties and explain
                  opportunities using real GEB listings.
                </p>

                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() =>
                        setMessage(suggestion)
                      }
                      className="rounded-full border border-[var(--stone-line)] bg-white px-3 py-2 text-xs font-medium transition hover:border-[var(--ink-soft)]"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

          {chatHistory.length > 0 && (
            <div className="space-y-5">
              {chatHistory.map((item) => (
                <div
                  key={item.id}
                  className={
                    item.role === "user"
                      ? "flex justify-end"
                      : "block"
                  }
                >
                  {item.role === "user" ? (
                    <div className="max-w-[85%] rounded-2xl bg-[var(--ink)] px-4 py-3 text-sm leading-6 text-white">
                      {item.content}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-2xl bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center gap-2">
                          <Sparkles
                            size={15}
                            className="text-[var(--ink-soft)]"
                          />

                          <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-soft)]">
                            GEB AI
                          </span>
                        </div>

                        <div className="space-y-1">
                          {parseRAGResponse(item.content).map((sec, idx) => (
                            <RAGSectionRenderer
                              key={idx}
                              title={sec.title}
                              body={sec.body}
                            />
                          ))}
                        </div>
                      </div>

                      {item.properties &&
                        item.properties.length > 0 && (
                          <div>
                            <div className="mb-3 flex items-center justify-between">
                              <p className="text-sm font-semibold">
                                Matching properties
                              </p>

                              <span className="text-xs text-[var(--ink-soft)]">
                                {item.properties.length} found
                              </span>
                            </div>

                            <div className="space-y-3">
                              {item.properties.map(
                                (property) => (
                                  <PropertyRecommendation
                                    key={property.id}
                                    property={property}
                                    onPropertySelect={
                                      onPropertySelect
                                    }
                                  />
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {loading && (
            <div className="mt-5 rounded-2xl bg-white p-5 text-center shadow-sm">
              <Loader2
                size={24}
                className="mx-auto animate-spin text-[var(--ink-soft)]"
              />

              <p className="mt-3 text-sm font-medium">
                GEB AI is analyzing the market...
              </p>

              <p className="mt-1 text-xs text-[var(--ink-soft)]">
                Retrieving relevant properties
              </p>
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-5 text-center">
              <p className="text-sm font-semibold text-red-600">
                GEB AI couldn't complete that request.
              </p>

              <p className="mt-2 text-xs text-red-500">
                {error}
              </p>
            </div>
          )}

          <div ref={scrollRef} />
        </div>

        <form
          onSubmit={askAI}
          className="absolute bottom-0 left-0 right-0 border-t border-[var(--stone-line)] bg-white p-3"
        >
          <div className="flex items-center gap-2 rounded-2xl bg-[var(--paper)] px-4 py-2">
            <input
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              placeholder="Ask GEB AI..."
              className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-[var(--ink-soft)]"
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--ink)] text-white transition hover:bg-[var(--copper-700)] disabled:opacity-30"
            >
              {loading ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
