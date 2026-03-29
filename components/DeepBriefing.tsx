"use client";

import { useState, useRef } from "react";
import type { BriefingResponse } from "@/lib/claude";

interface DeepBriefingProps {
  briefing: BriefingResponse;
  articleTitle: string;
}

export default function DeepBriefing({ briefing, articleTitle }: DeepBriefingProps) {
  const [followUpQ, setFollowUpQ] = useState("");
  const [followUpA, setFollowUpA] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sentimentColors: Record<string, { color: string; bg: string }> = {
    bullish: { color: "var(--positive)", bg: "rgba(16,185,129,0.1)" },
    bearish: { color: "var(--negative)", bg: "rgba(239,68,68,0.1)" },
    neutral: { color: "var(--neutral)", bg: "rgba(107,114,128,0.1)" },
  };

  const s = sentimentColors[briefing.sentiment] ?? sentimentColors.neutral;

  const handleFollowUp = async () => {
    if (!followUpQ.trim() || streaming) return;
    setStreaming(true);
    setFollowUpA("");

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          follow_up_question: followUpQ,
          briefing_context: briefing,
        }),
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
        console.error("Follow-up error:", err);
        setFollowUpA("Failed to get answer. Please try again.");
      }
    } finally {
      setStreaming(false);
    }
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: 32,
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "var(--accent-primary)",
    marginBottom: 16,
  };

  return (
    <div
      id="deep-briefing"
      style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}
    >
      {/* Hero */}
      <div style={{ marginBottom: 40, paddingTop: 24 }}>
        <div
          style={{
            display: "inline-flex",
            padding: "4px 14px",
            borderRadius: 999,
            background: s.bg,
            color: s.color,
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          {briefing.sentiment.toUpperCase()}
        </div>
        <h1
          className="font-headline"
          style={{
            fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
            fontWeight: 700,
            lineHeight: 1.2,
            color: "var(--text-primary)",
            marginBottom: 16,
          }}
        >
          {briefing.headline}
        </h1>
        <p
          style={{
            fontSize: 16,
            lineHeight: 1.7,
            color: "var(--text-secondary)",
            borderLeft: "3px solid var(--accent-primary)",
            paddingLeft: 16,
          }}
        >
          {briefing.tldr}
        </p>
        <p
          style={{
            fontSize: 12,
            color: "var(--text-tertiary)",
            marginTop: 12,
          }}
        >
          Source article: {articleTitle}
        </p>
      </div>

      {/* Key Developments Timeline */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Key Developments</div>
        <div style={{ position: "relative", paddingLeft: 24 }}>
          <div
            style={{
              position: "absolute",
              left: 6,
              top: 4,
              bottom: 4,
              width: 2,
              background:
                "linear-gradient(180deg, var(--accent-primary), var(--accent-secondary), transparent)",
              borderRadius: 1,
            }}
          />
          {briefing.key_developments.map((dev, i) => (
            <div
              key={i}
              style={{
                position: "relative",
                marginBottom: 20,
                paddingBottom: 4,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: -22,
                  top: 5,
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "var(--accent-primary)",
                  border: "2px solid var(--bg-primary)",
                }}
              />
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: "var(--text-primary)",
                }}
              >
                {dev.point}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Key Players */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Key Players</div>
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}
        >
          {briefing.key_players.map((player, i) => (
            <div
              key={i}
              style={{
                padding: 16,
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--bg-tertiary)",
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: 4,
                }}
              >
                {player.name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-tertiary)",
                  marginBottom: 8,
                }}
              >
                {player.role}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                {player.stance}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market Impact */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Market Impact</div>
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            background:
              "linear-gradient(135deg, rgba(59,130,246,0.06), rgba(139,92,246,0.06))",
            border: "1px solid rgba(59,130,246,0.15)",
          }}
        >
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: "var(--text-primary)",
            }}
          >
            {briefing.market_impact}
          </p>
        </div>
      </div>

      {/* What to Watch */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>What to Watch</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {briefing.what_to_watch.map((item, i) => (
            <span
              key={i}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                border: "1px solid var(--border)",
                background: "var(--bg-tertiary)",
                fontSize: 13,
                color: "var(--text-secondary)",
              }}
            >
              👁️ {item}
            </span>
          ))}
        </div>
      </div>

      {/* Contrarian View */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Contrarian View</div>
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            background: "rgba(239,68,68,0.04)",
            border: "1px solid rgba(239,68,68,0.12)",
            borderLeft: "3px solid var(--negative)",
          }}
        >
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: "var(--text-secondary)",
              fontStyle: "italic",
            }}
          >
            🤔 {briefing.contrarian_view}
          </p>
        </div>
      </div>

      {/* Follow-up Q&A */}
      <div style={{ ...sectionStyle, marginTop: 48 }}>
        <div style={sectionTitleStyle}>Ask a follow-up</div>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            id="follow-up-input"
            type="text"
            value={followUpQ}
            onChange={(e) => setFollowUpQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFollowUp()}
            placeholder="e.g. What does this mean for retail investors?"
            style={{
              flex: 1,
              height: 48,
              padding: "0 16px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--bg-tertiary)",
              color: "var(--text-primary)",
              fontSize: 14,
              outline: "none",
            }}
          />
          <button
            id="follow-up-submit"
            onClick={handleFollowUp}
            disabled={streaming || !followUpQ.trim()}
            style={{
              padding: "0 24px",
              height: 48,
              borderRadius: 12,
              border: "none",
              background: streaming
                ? "var(--border)"
                : "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: streaming ? "wait" : "pointer",
            }}
          >
            {streaming ? "..." : "Ask"}
          </button>
        </div>

        {followUpA && (
          <div
            id="follow-up-answer"
            style={{
              marginTop: 16,
              padding: 20,
              borderRadius: 12,
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              fontSize: 14,
              lineHeight: 1.7,
              color: "var(--text-primary)",
              whiteSpace: "pre-wrap",
            }}
          >
            {followUpA}
            {streaming && (
              <span
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 16,
                  background: "var(--accent-primary)",
                  marginLeft: 2,
                  animation: "blink 1s step-end infinite",
                }}
              />
            )}
            <style>{`
              @keyframes blink {
                50% { opacity: 0; }
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
}
