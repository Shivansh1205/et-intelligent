"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Masthead from "@/components/Masthead";
import NewsCard from "@/components/NewsCard";
import { createClient } from "@/lib/supabase/client";

interface Article {
  id: string;
  title: string;
  summary: string;
  image_url?: string;
  source_url: string;
  entities: Record<string, string[]>;
  topic_tags: string[];
  sentiment_score: number;
  published_at: string;
  relevance_score?: number;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function BookmarksPage() {
  const router = useRouter();
  const supabase = createClient();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ persona?: string; display_name?: string } | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: prof } = await supabase
        .from("profiles")
        .select("persona, display_name")
        .eq("id", user.id)
        .single();
      setProfile(prof);

      const res = await fetch("/api/section?section=bookmarks&offset=0&limit=50");
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles ?? []);
      }
      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClick = (articleId: string) => {
    fetch("/api/engagement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "engagement", article_id: articleId, interaction_type: "click" }),
    });
    router.push(`/article/${articleId}`);
  };

  const handleBookmark = async (articleId: string) => {
    await fetch("/api/engagement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "bookmark", article_id: articleId }),
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <Masthead
        persona={profile?.persona}
        displayName={profile?.display_name ?? undefined}
        activeSection="bookmarks"
      />

      {/* Tagline strip */}
      <div style={{ background: "var(--paper-deep)", borderBottom: "1px solid var(--rule)", padding: "7px 24px", textAlign: "center" }}>
        <span className="font-body" style={{ fontSize: 13, fontStyle: "italic", color: "var(--ink-secondary)" }}>
          Stories you have saved for later reading.
        </span>
      </div>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 80 }}>
            <span className="font-mono" style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
              Loading saved articles...
            </span>
          </div>
        ) : articles.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ height: 1, background: "var(--rule)", marginBottom: 24 }} />
            <span className="font-body" style={{ fontSize: 15, fontStyle: "italic", color: "var(--ink-tertiary)" }}>
              You haven&apos;t saved any stories yet.
            </span>
            <div style={{ height: 1, background: "var(--rule)", marginTop: 24 }} />
          </div>
        ) : (
          <>
            {/* Section header */}
            <div className="section-break" style={{ margin: "0 0 20px" }}>
              <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink)", whiteSpace: "nowrap" }}>
                Saved Articles — {articles.length} {articles.length === 1 ? "story" : "stories"}
              </span>
            </div>

            {/* Clean list layout — each saved article as a full-width row */}
            <div style={{ borderTop: "2px solid var(--ink)" }}>
              {articles.map((article, i) => {
                const companies = article.entities?.companies ?? [];
                const sectors = article.entities?.sectors ?? [];
                const tag = (article.topic_tags?.[0] ?? sectors[0] ?? "business").toUpperCase();
                return (
                  <div
                    key={article.id}
                    className="story-entry"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "40px 1fr auto",
                      gap: "0 20px",
                      alignItems: "start",
                      padding: "18px 0",
                      borderBottom: "1px solid var(--rule)",
                      cursor: "pointer",
                    }}
                    onClick={() => handleClick(article.id)}
                  >
                    {/* Index number */}
                    <div className="font-headline" style={{ fontSize: 28, fontWeight: 700, color: "var(--rule-heavy)", lineHeight: 1, paddingTop: 2 }}>
                      {i + 1}
                    </div>

                    {/* Content */}
                    <div>
                      <div className="font-mono" style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 5 }}>
                        {tag}
                      </div>
                      <h3 className="font-headline story-headline" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.25, color: "var(--ink)", marginBottom: 6 }}>
                        {article.title}
                      </h3>
                      <p className="font-body" style={{ fontSize: 13, fontStyle: "italic", lineHeight: 1.6, color: "var(--ink-secondary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {article.summary}
                      </p>
                      {companies.length > 0 && (
                        <div style={{ marginTop: 6, display: "flex", gap: 12 }}>
                          {companies.slice(0, 3).map((c) => (
                            <span key={c} className="entity-link font-mono" style={{ fontSize: 10, letterSpacing: "0.06em", color: "var(--ink-tertiary)" }}>{c}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Meta */}
                    <div style={{ textAlign: "right", paddingTop: 2 }}>
                      <div className="font-mono" style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-tertiary)", marginBottom: 4 }}>
                        {timeAgo(article.published_at)}
                      </div>
                      <div className="font-mono" style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent-secondary)" }}>
                        SAVED
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
