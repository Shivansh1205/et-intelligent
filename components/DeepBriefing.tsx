"use client";

import { useState, useRef } from "react";
import type { BriefingResponse } from "@/lib/claude";

interface DeepBriefingProps {
  briefing: BriefingResponse;
  articleTitle: string;
}

function getSentiment(s: string): { label: string; color: string } {
  if (s === "bullish") return { label: "BULLISH", color: "var(--accent)" };
  if (s === "bearish") return { label: "BEARISH", color: "var(--accent-secondary)" };
  return { label: "NEUTRAL", color: "var(--ink-tertiary)" };
}

export default function DeepBriefing({ briefing, articleTitle }: DeepBriefingProps) {
  const [followUpQ, setFollowUpQ] = useState("");
  const [followUpA, setFollowUpA] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const sentiment = getSentiment(briefing.sentiment);

  const handleFollowUp = async () => {
    if (!followUpQ.trim() || streaming) return;
    setStreaming(true);
    setFollowUpA("");
    abortRef.current = new AbortController();
    try {
      const res = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ follow_up_question: followUpQ, briefing_context: briefing }),
        signal: abortRef.current.signal,
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        let result = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          result += decoder.decode(value, { stream: true });
          setFollowUpA(result);
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setFollowUpA("Failed to get answer. Please try again.");
      }
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div id="deep-briefing" style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", padding: "32px 0 0", borderBottom: "2px solid var(--ink)", marginBottom: 0 }}>
        <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 8 }}>
          Intelligence Briefing
        </div>
        <div style={{ height: 2, background: "var(--accent)", marginBottom: 16 }} />
        <h1 className="font-headline" style={{ fontSize: 42, fontWeight: 700, lineHeight: 1.1, color: "var(--ink)", maxWidth: 700, margin: "0 auto 16px" }}>
          {briefing.headline}
        </h1>
        <div style={{ height: 1, background: "var(--rule)", margin: "0 auto 12px", maxWidth: 700 }} />
        <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-tertiary)", marginBottom: 16 }}>
          Intelligence Briefing &middot; 1 article synthesised &middot; {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </div>
        <div style={{ height: 2, background: "var(--ink)", marginBottom: 0 }} />
      </div>

      {/* TL;DR */}
      <div style={{ background: "var(--paper-deep)", padding: "24px 40px", borderBottom: "1px solid var(--rule-heavy)" }}>
        <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 8 }}>
          In Brief
        </div>
        <p className="font-body" style={{ fontSize: 16, fontStyle: "italic", lineHeight: 1.6, color: "var(--ink)" }}>
          {briefing.tldr}
        </p>
      </div>

      {/* Two-column main content */}
      <div style={{ display: "grid", gridTemplateColumns: "60fr 40fr", borderBottom: "1px solid var(--rule)" }}>
        {/* Left column */}
        <div style={{ padding: "32px 32px 32px 0", borderRight: "1px solid var(--rule-heavy)" }}>
          {/* Key Developments */}
          <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid var(--rule)" }}>
            Key Developments
          </div>
          {briefing.key_developments.map((dev, i) => (
            <div key={i} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid var(--rule)", display: "flex", gap: 16 }}>
              <div className="font-headline" style={{ fontSize: 36, fontWeight: 700, color: "var(--rule)", lineHeight: 1, flexShrink: 0, width: 36 }}>
                {i + 1}
              </div>
              <p className="font-body" style={{ fontSize: 14, lineHeight: 1.75, color: "var(--ink)", textIndent: "1.5em" }}>
                {dev.point}
              </p>
            </div>
          ))}

          {/* Market Impact pullquote */}
          <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid var(--rule)" }}>
            Market Impact
          </div>
          <div className="pullquote" style={{ margin: "0 0 28px" }}>
            <p className="font-headline" style={{ fontSize: 20, fontWeight: 700, fontStyle: "italic", lineHeight: 1.5, color: "var(--ink)", textAlign: "center" }}>
              {briefing.market_impact}
            </p>
          </div>

          {/* Contrarian View */}
          <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent-secondary)", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid var(--rule)" }}>
            A Dissenting View
          </div>
          <div style={{ borderLeft: "2px solid var(--accent-secondary)", paddingLeft: "2em", marginLeft: "0" }}>
            <p className="font-body" style={{ fontSize: 14, fontStyle: "italic", lineHeight: 1.75, color: "var(--ink-secondary)" }}>
              {briefing.contrarian_view}
            </p>
          </div>
        </div>

        {/* Right column */}
        <div style={{ padding: "32px 0 32px 32px" }}>
          {/* Key Players */}
          <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid var(--rule)" }}>
            Key Players
          </div>
          {briefing.key_players.map((player, i) => {
            const stance = player.stance?.toLowerCase() ?? "";
            const stanceColor = stance.includes("bull") ? "var(--accent)" : stance.includes("bear") ? "var(--accent-secondary)" : "var(--ink-tertiary)";
            const stanceLabel = stance.includes("bull") ? "BULLISH ON THIS" : stance.includes("bear") ? "BEARISH" : "NEUTRAL";
            return (
              <div key={i} style={{ paddingBottom: 14, marginBottom: 14, borderBottom: "1px solid var(--rule)" }}>
                <div className="font-headline" style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>{player.name}</div>
                <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-tertiary)", marginBottom: 4 }}>{player.role}</div>
                <div className="font-body" style={{ fontSize: 13, color: "var(--ink-secondary)", lineHeight: 1.5, marginBottom: 4 }}>{player.stance}</div>
                <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: stanceColor }}>{stanceLabel}</div>
              </div>
            );
          })}

          {/* What to Watch */}
          <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid var(--rule)", marginTop: 24 }}>
            Watch For
          </div>
          {briefing.what_to_watch.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <span className="font-body" style={{ fontSize: 14, color: "var(--ink-secondary)", flexShrink: 0 }}>—</span>
              <p className="font-body" style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink)" }}>{item}</p>
            </div>
          ))}

          {/* Sentiment */}
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--rule)" }}>
            <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-tertiary)", marginBottom: 4 }}>
              Overall Tone
            </div>
            <div className="font-mono" style={{ fontSize: 14, letterSpacing: "0.1em", textTransform: "uppercase", color: sentiment.color }}>
              {sentiment.label}
            </div>
          </div>
        </div>
      </div>

      {/* Ask the Analyst */}
      <div style={{ padding: "32px 0 48px" }}>
        <div className="section-break" style={{ marginBottom: 24 }}>
          <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent)", whiteSpace: "nowrap" }}>
            Ask the Analyst
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
          <input
            id="follow-up-input"
            type="text"
            value={followUpQ}
            onChange={(e) => setFollowUpQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFollowUp()}
            placeholder="What would you like to know about this story?"
            style={{
              flex: 1, background: "transparent",
              border: "none", borderBottom: "1px solid var(--ink)",
              padding: "8px 0", fontFamily: "'Lora', serif",
              fontStyle: "italic", fontSize: 14, color: "var(--ink)",
              outline: "none",
            }}
          />
          <button
            id="follow-up-submit"
            onClick={handleFollowUp}
            disabled={streaming || !followUpQ.trim()}
            style={{
              background: "none", border: "none", cursor: streaming ? "wait" : "pointer",
              fontFamily: "'Geist Mono', monospace", fontSize: 11,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: streaming ? "var(--ink-tertiary)" : "var(--accent)",
              padding: "8px 0",
            }}
          >
            {streaming ? "Thinking..." : "Send"}
          </button>
        </div>
        {followUpA && (
          <div
            id="follow-up-answer"
            style={{
              marginTop: 20, background: "var(--paper-deep)",
              borderLeft: "3px solid var(--accent)", padding: 20,
              fontFamily: "'Lora', serif", fontSize: 14,
              lineHeight: 1.75, color: "var(--ink)", whiteSpace: "pre-wrap",
            }}
          >
            {followUpA}
            {streaming && (
              <span style={{ display: "inline-block", width: 2, height: 16, background: "var(--accent)", marginLeft: 2, animation: "blink 1s step-end infinite" }} />
            )}
            <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
          </div>
        )}
      </div>
    </div>
  );
}
