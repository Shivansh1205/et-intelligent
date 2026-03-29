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

const REGULATOR_KEYWORDS: Record<string, string> = {
  rbi: "RBI",
  sebi: "SEBI",
  "finance ministry": "FINANCE MINISTRY",
  budget: "BUDGET",
  "income tax": "INCOME TAX",
  "gst": "GST",
  "government": "GOVT",
};

function getRegulator(article: Article): string {
  const text = (article.title + " " + article.summary).toLowerCase();
  for (const [key, label] of Object.entries(REGULATOR_KEYWORDS)) {
    if (text.includes(key)) return label;
  }
  return "POLICY";
}

function RegulatoryWatch({ articles }: { articles: Article[] }) {
  const top = articles.slice(0, 5);

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ borderTop: "2px solid var(--ink)", borderBottom: "1px solid var(--rule)", padding: "10px 0", marginBottom: 16 }}>
        <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink)" }}>
          Regulatory Watch
        </span>
      </div>
      <div style={{ borderTop: "1px solid var(--rule)" }}>
        {top.map((a) => {
          const regulator = getRegulator(a);
          return (
            <div key={a.id} style={{ display: "flex", gap: 16, alignItems: "baseline", padding: "10px 0", borderBottom: "1px solid var(--rule)" }}>
              <span className="font-mono" style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent)", flexShrink: 0, minWidth: 100 }}>
                {regulator}
              </span>
              <span className="font-headline" style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3, color: "var(--ink)" }}>
                {a.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PolicyPage() {
  return (
    <SectionPage
      section="policy"
      tagline="Government and regulatory decisions impacting Indian business and markets."
      sectionLabel="Policy"
      renderAboveFold={(articles) => <RegulatoryWatch articles={articles} />}
    />
  );
}
