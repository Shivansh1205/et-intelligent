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

const FUNDING_KEYWORDS = ["fund", "raise", "series", "seed", "invest", "crore", "million", "billion", "valuation"];
const IPO_KEYWORDS = ["ipo", "listing", "public offer", "sebi filing"];
const ACQ_KEYWORDS = ["acqui", "merger", "takeover", "buyout"];

function getLabel(article: Article): string | null {
  const text = (article.title + " " + article.summary).toLowerCase();
  if (ACQ_KEYWORDS.some((k) => text.includes(k))) return "ACQUISITION";
  if (IPO_KEYWORDS.some((k) => text.includes(k))) return "IPO";
  if (FUNDING_KEYWORDS.some((k) => text.includes(k))) return "FUNDING";
  return null;
}

function FundingTracker({ articles }: { articles: Article[] }) {
  const tagged = articles
    .map((a) => ({ article: a, label: getLabel(a) }))
    .filter((x) => x.label !== null)
    .slice(0, 6);

  if (tagged.length === 0) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ borderTop: "2px solid var(--ink)", borderBottom: "1px solid var(--rule)", padding: "10px 0", marginBottom: 16 }}>
        <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink)" }}>
          Funding Tracker
        </span>
      </div>
      <div style={{ borderTop: "1px solid var(--rule)" }}>
        {tagged.map(({ article: a, label }, i) => (
          <div key={a.id} style={{ display: "flex", gap: 16, alignItems: "baseline", padding: "10px 0", borderBottom: "1px solid var(--rule)" }}>
            <span className="font-mono" style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent-secondary)", flexShrink: 0, minWidth: 80 }}>
              {label}
            </span>
            <span className="font-headline" style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3, color: "var(--ink)" }}>
              {a.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StartupsPage() {
  return (
    <SectionPage
      section="startups"
      tagline="Capital flow and innovation trends shaping India's startup ecosystem."
      sectionLabel="Startups"
      renderAboveFold={(articles) => <FundingTracker articles={articles} />}
    />
  );
}
