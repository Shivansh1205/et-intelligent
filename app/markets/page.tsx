"use client";

import SectionPage from "@/components/SectionPage";

interface Article {
  id: string;
  title: string;
  summary: string;
  sentiment_score: number;
  topic_tags: string[];
  entities: Record<string, string[]>;
  published_at: string;
  source_url: string;
  image_url?: string;
  relevance_score?: number;
}

function getSentiment(score: number) {
  if (score > 0.3) return { label: "BULLISH", color: "var(--accent-secondary)" };
  if (score < -0.3) return { label: "BEARISH", color: "var(--accent)" };
  return { label: "NEUTRAL", color: "var(--ink-tertiary)" };
}

function MarketPulse({ articles }: { articles: Article[] }) {
  // Compute overall sentiment from top articles
  const scores = articles.slice(0, 10).map((a) => a.sentiment_score);
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const overall = getSentiment(avg);
  const top3 = articles.slice(0, 3);

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Pulse header */}
      <div style={{ borderTop: "2px solid var(--ink)", borderBottom: "1px solid var(--rule)", padding: "10px 0", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink)" }}>
          Market Pulse
        </span>
        <span className="font-body" style={{ fontSize: 13, fontStyle: "italic", color: "var(--ink-secondary)" }}>
          Overall sentiment:{" "}
          <span className="font-mono" style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: overall.color }}>
            {overall.label}
          </span>
        </span>
      </div>

      {/* 3 key headlines */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: "1px solid var(--rule)" }}>
        {top3.map((a, i) => {
          const s = getSentiment(a.sentiment_score);
          return (
            <div key={a.id} style={{ padding: "14px 16px", borderRight: i < 2 ? "1px solid var(--rule)" : "none" }}>
              <div className="font-mono" style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: s.color, marginBottom: 6 }}>
                {s.label}
              </div>
              <div className="font-headline" style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3, color: "var(--ink)" }}>
                {a.title}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MarketsPage() {
  return (
    <SectionPage
      section="markets"
      tagline="Markets are reacting to interest rate expectations and global capital flows."
      sectionLabel="Markets"
      renderAboveFold={(articles) => <MarketPulse articles={articles} />}
    />
  );
}
