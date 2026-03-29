"use client";

import type { DecisionResult } from "@/lib/decision";

interface DecisionInsightsProps {
  insights: DecisionResult | null;
  loading: boolean;
  persona: string;
}

function Skeleton() {
  return (
    <div style={{ padding: "20px 0" }}>
      {[100, 80, 90, 70].map((w, i) => (
        <div key={i} style={{ height: 8, width: `${w}%`, background: "var(--paper-deep)", marginBottom: 8 }} />
      ))}
    </div>
  );
}

export default function DecisionInsights({ insights, loading, persona }: DecisionInsightsProps) {
  if (!loading && !insights) return null;

  return (
    <div
      style={{
        border: "1px solid var(--rule-heavy)",
        borderLeft: "3px solid var(--ink)",
        background: "var(--paper-raised)",
        marginBottom: 24,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 20px",
          borderBottom: "1px solid var(--rule)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          className="font-mono"
          style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink)" }}
        >
          Decision Insights
        </span>
        <span
          className="font-mono"
          style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}
        >
          {persona} perspective
        </span>
      </div>

      <div style={{ padding: "16px 20px" }}>
        {loading ? (
          <Skeleton />
        ) : insights ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
            {/* Summary + Confidence */}
            <div style={{ paddingRight: 20, borderRight: "1px solid var(--rule)" }}>
              <div
                className="font-mono"
                style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-tertiary)", marginBottom: 8 }}
              >
                Summary
              </div>
              <p className="font-body" style={{ fontSize: 13, lineHeight: 1.65, color: "var(--ink)", marginBottom: 16 }}>
                {insights.summary}
              </p>
              {/* Confidence bar */}
              <div
                className="font-mono"
                style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-tertiary)", marginBottom: 6 }}
              >
                Confidence — {insights.confidence}%
              </div>
              <div style={{ height: 4, background: "var(--paper-deep)", position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    width: `${insights.confidence}%`,
                    background: insights.confidence >= 70 ? "var(--accent-secondary)" : insights.confidence >= 40 ? "var(--ink-tertiary)" : "var(--accent)",
                    transition: "width 0.6s ease",
                  }}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ padding: "0 20px", borderRight: "1px solid var(--rule)" }}>
              <div
                className="font-mono"
                style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-tertiary)", marginBottom: 8 }}
              >
                Actions
              </div>
              {insights.actions.map((action, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <span className="font-body" style={{ fontSize: 13, color: "var(--ink-tertiary)", flexShrink: 0 }}>—</span>
                  <span className="font-body" style={{ fontSize: 13, lineHeight: 1.55, color: "var(--ink)" }}>{action}</span>
                </div>
              ))}
            </div>

            {/* Risks */}
            <div style={{ paddingLeft: 20 }}>
              <div
                className="font-mono"
                style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-tertiary)", marginBottom: 8 }}
              >
                Risks
              </div>
              {insights.risks.map((risk, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <span className="font-body" style={{ fontSize: 13, color: "var(--accent)", flexShrink: 0 }}>—</span>
                  <span className="font-body" style={{ fontSize: 13, lineHeight: 1.55, color: "var(--ink-secondary)" }}>{risk}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
