"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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

interface SectionPageProps {
  section: "markets" | "startups" | "policy" | "bookmarks";
  /** Tagline shown in the dateline-style strip below masthead */
  tagline: string;
  /** Label for the lead section header e.g. "Market Pulse" */
  sectionLabel: string;
  /** Render extra content above the article grid (pulse strip, tracker, etc.) */
  renderAboveFold?: (articles: Article[]) => React.ReactNode;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getSentiment(score: number) {
  if (score > 0.3) return { label: "BULLISH", color: "var(--accent-secondary)" };
  if (score < -0.3) return { label: "BEARISH", color: "var(--accent)" };
  return { label: "NEUTRAL", color: "var(--ink-tertiary)" };
}

export default function SectionPage({
  section,
  tagline,
  sectionLabel,
  renderAboveFold,
}: SectionPageProps) {
  const router = useRouter();
  const supabase = createClient();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [profile, setProfile] = useState<{ persona?: string; display_name?: string } | null>(null);
  const offsetRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("persona, display_name")
          .eq("id", user.id)
          .single();
        setProfile(prof);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchArticles = useCallback(async (offset: number, append = false) => {
    try {
      const res = await fetch(`/api/section?section=${section}&offset=${offset}&limit=20`);
      if (!res.ok) return;
      const data = await res.json();
      const fetched: Article[] = data.articles ?? [];
      if (append) {
        setArticles((prev) => [...prev, ...fetched]);
      } else {
        setArticles(fetched);
      }
      setHasMore(fetched.length === 20);
      offsetRef.current = offset + fetched.length;
    } catch (err) {
      console.error("Section fetch error:", err);
    }
  }, [section]);

  useEffect(() => {
    setLoading(true);
    offsetRef.current = 0;
    fetchArticles(0).finally(() => setLoading(false));
  }, [fetchArticles]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchArticles(offsetRef.current, true);
    setLoadingMore(false);
  }, [loadingMore, hasMore, fetchArticles]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const handleBookmark = async (articleId: string) => {
    await fetch("/api/engagement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "bookmark", article_id: articleId }),
    });
  };

  const handleClick = (articleId: string) => {
    fetch("/api/engagement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "engagement", article_id: articleId, interaction_type: "click" }),
    });
    router.push(`/article/${articleId}`);
  };

  const lead = articles[0];
  const rest = articles.slice(1);

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <Masthead
        persona={profile?.persona}
        displayName={profile?.display_name ?? undefined}
        activeSection={section}
      />

      {/* Tagline strip */}
      <div style={{
        background: "var(--paper-deep)",
        borderBottom: "1px solid var(--rule)",
        padding: "7px 24px",
        textAlign: "center",
      }}>
        <span className="font-body" style={{ fontSize: 13, fontStyle: "italic", color: "var(--ink-secondary)" }}>
          {tagline}
        </span>
      </div>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 80 }}>
            <span className="font-mono" style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
              Loading {sectionLabel}...
            </span>
          </div>
        ) : articles.length === 0 ? (
          <EmptyState section={section} />
        ) : (
          <>
            {/* Above-fold custom content */}
            {renderAboveFold?.(articles)}

            {/* Section header */}
            <div className="section-break" style={{ margin: "0 0 20px" }}>
              <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink)", whiteSpace: "nowrap" }}>
                {sectionLabel}
              </span>
            </div>

            {/* Lead story + sidebar */}
            {lead && (
              <div style={{ borderTop: "2px solid var(--ink)", display: "grid", gridTemplateColumns: "8fr 4fr", marginBottom: 32 }}>
                {/* Lead */}
                <div style={{ padding: "24px 24px 24px 0", borderRight: "1px solid var(--rule-heavy)" }}>
                  <NewsCard article={lead} onBookmark={handleBookmark} onClick={handleClick} variant="lead" />
                </div>
                {/* Sidebar: top 5 headlines */}
                <div style={{ padding: "24px 0 24px 24px" }}>
                  <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink)", marginBottom: 10, paddingBottom: 6, borderBottom: "2px solid var(--ink)" }}>
                    Latest in {sectionLabel}
                  </div>
                  {rest.slice(0, 6).map((a, i) => {
                    const s = getSentiment(a.sentiment_score);
                    return (
                      <div
                        key={a.id}
                        className="story-entry"
                        style={{ paddingBottom: 12, marginBottom: 12, borderBottom: "1px solid var(--rule)", cursor: "pointer" }}
                        onClick={() => handleClick(a.id)}
                      >
                        <div className="font-headline story-headline" style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3, color: "var(--ink)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: 4, transition: "color 200ms" }}>
                          {a.title}
                        </div>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <span className="font-mono" style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>{timeAgo(a.published_at)}</span>
                          <span className="font-mono" style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: s.color }}>{s.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Secondary grid */}
            {rest.length > 6 && (
              <>
                <div className="section-break" style={{ margin: "0 0 20px" }}>
                  <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink)", whiteSpace: "nowrap" }}>
                    More Stories
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderTop: "1px solid var(--rule)" }}>
                  {rest.slice(6).map((article, i) => (
                    <div key={article.id} style={{ padding: "20px 16px", borderRight: i % 4 < 3 ? "1px solid var(--rule)" : "none", borderBottom: "1px solid var(--rule)" }}>
                      <NewsCard article={article} onBookmark={handleBookmark} onClick={handleClick} variant="secondary" />
                    </div>
                  ))}
                </div>
              </>
            )}

            <div ref={sentinelRef} style={{ height: 1 }} />
            {loadingMore && (
              <div style={{ textAlign: "center", padding: 24 }}>
                <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
                  Loading more stories...
                </span>
              </div>
            )}
            {!hasMore && articles.length > 0 && (
              <div style={{ textAlign: "center", padding: 32, borderTop: "1px solid var(--rule)" }}>
                <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
                  End of {sectionLabel} section
                </span>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function EmptyState({ section }: { section: string }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 0" }}>
      <div style={{ height: 1, background: "var(--rule)", marginBottom: 24 }} />
      <span className="font-body" style={{ fontSize: 15, fontStyle: "italic", color: "var(--ink-tertiary)" }}>
        {section === "bookmarks"
          ? "You haven't saved any stories yet."
          : "No relevant stories at the moment."}
      </span>
      <div style={{ height: 1, background: "var(--rule)", marginTop: 24 }} />
    </div>
  );
}
