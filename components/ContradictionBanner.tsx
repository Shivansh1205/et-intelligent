"use client";

import type { ContradictionResult } from "@/lib/contradiction";

interface ContradictionBannerProps {
  contradiction: ContradictionResult | null;
  loading: boolean;
}

export default function ContradictionBanner({ contradiction, loading }: ContradictionBannerProps) {
  if (loading || !contradiction?.contradiction) return null;

  return (
    <div
      style={{
        background: "var(--paper-deep)",
        borderTop: "1px solid var(--rule-heavy)",
        borderBottom: "1px solid var(--rule-heavy)",
        borderLeft: "3px solid var(--ink-tertiary)",
        padding: "14px 20px",
        marginBottom: 24,
      }}
    >
      {/* Label */}
      <div
        className="font-mono"
        style={{
          fontSize: 10,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "var(--ink-tertiary)",
          marginBottom: 6,
        }}
      >
        Conflicting Signals Detected
      </div>

      {/* Summary */}
      <p
        className="font-body"
        style={{ fontSize: 13, fontStyle: "italic", lineHeight: 1.6, color: "var(--ink-secondary)", marginBottom: 10 }}
      >
        {contradiction.summary}
      </p>

      {/* Viewpoints */}
      {contradiction.viewpoints.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {contradiction.viewpoints.map((vp, i) => (
            <div key={i} style={{ display: "flex", gap: 8 }}>
              <span className="font-mono" style={{ fontSize: 10, color: "var(--ink-tertiary)", flexShrink: 0, paddingTop: 2 }}>
                {i + 1}.
              </span>
              <span className="font-body" style={{ fontSize: 13, lineHeight: 1.55, color: "var(--ink)" }}>{vp}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
