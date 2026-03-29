"use client";

import type { SimulationResult } from "@/lib/simulation";

interface FutureSimulationProps {
  simulation: SimulationResult | null;
  loading: boolean;
}

function Skeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0, borderTop: "1px solid var(--rule)" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ padding: "20px 16px", borderRight: i < 2 ? "1px solid var(--rule)" : "none" }}>
          <div style={{ height: 10, width: 80, background: "var(--paper-deep)", marginBottom: 12 }} />
          <div style={{ height: 8, background: "var(--paper-deep)", marginBottom: 6 }} />
          <div style={{ height: 8, background: "var(--paper-deep)", marginBottom: 6, width: "85%" }} />
          <div style={{ height: 8, background: "var(--paper-deep)", width: "70%" }} />
        </div>
      ))}
    </div>
  );
}

export default function FutureSimulation({ simulation, loading }: FutureSimulationProps) {
  if (!loading && !simulation) return null;

  return (
    <div style={{ marginTop: 32, borderTop: "2px solid var(--ink)" }}>
      {/* Section header */}
      <div className="section-break" style={{ margin: "20px 0 16px" }}>
        <span
          className="font-mono"
          style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink)", whiteSpace: "nowrap" }}
        >
          Future Outlook
        </span>
      </div>

      {loading ? (
        <Skeleton />
      ) : simulation ? (
        <>
          {/* Three scenario columns */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: "1px solid var(--rule)" }}>
            {/* Bull Case */}
            <div style={{ padding: "20px 16px", borderRight: "1px solid var(--rule)" }}>
              <div
                className="font-mono"
                style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent-secondary)", marginBottom: 10 }}
              >
                Bull Case
              </div>
              <p
                className="font-body"
                style={{ fontSize: 13, lineHeight: 1.7, color: "var(--accent-secondary)" }}
              >
                {simulation.bull_case}
              </p>
            </div>

            {/* Bear Case */}
            <div style={{ padding: "20px 16px", borderRight: "1px solid var(--rule)" }}>
              <div
                className="font-mono"
                style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 10 }}
              >
                Bear Case
              </div>
              <p
                className="font-body"
                style={{ fontSize: 13, lineHeight: 1.7, color: "var(--accent)" }}
              >
                {simulation.bear_case}
              </p>
            </div>

            {/* Most Likely */}
            <div style={{ padding: "20px 16px" }}>
              <div
                className="font-mono"
                style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink)", marginBottom: 10 }}
              >
                Most Likely
              </div>
              <p
                className="font-body"
                style={{ fontSize: 13, lineHeight: 1.7, color: "var(--ink-secondary)" }}
              >
                {simulation.most_likely}
              </p>
            </div>
          </div>

          {/* Key Variables */}
          {simulation.key_variables.length > 0 && (
            <div
              style={{
                borderTop: "1px solid var(--rule)",
                padding: "16px",
                background: "var(--paper-deep)",
              }}
            >
              <div
                className="font-mono"
                style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink-tertiary)", marginBottom: 10 }}
              >
                Key Variables to Watch
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 24px" }}>
                {simulation.key_variables.map((v, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
                    <span className="font-body" style={{ fontSize: 13, color: "var(--ink-secondary)" }}>—</span>
                    <span className="font-body" style={{ fontSize: 13, color: "var(--ink)" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
