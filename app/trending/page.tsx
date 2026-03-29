"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Masthead from "@/components/Masthead";
import { createClient } from "@/lib/supabase/client";

interface TrendingArticle {
  id: string;
  title: string;
  summary: string;
  image_url?: string;
  source_url: string;
  entities: Record<string, string[]>;
  topic_tags: string[];
  sentiment_score: number;
  published_at: string;
  trending_score: number;
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

function getCategory(article: TrendingArticle): string {
  const tags = article.topic_tags ?? [];
  if (tags.length > 0) return tags[0].toUpperCase();
  const sectors = article.entities?.sectors ?? [];
  if (sectors.length > 0) return sectors[0].toUpperCase();
  return "BUSINESS";
}

export default function TrendingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [articles, setArticles] = useState<TrendingArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
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

  const fetchTrending = useCallback(async (offset: number, append = false) => {
    try {
      const res = await fetch(`/api/trending?offset=${offset}&limit=20`);
      if (!res.ok) return;
      const data = await res.json();
      const fetched: TrendingArticle[] = data.articles ?? [];
      if (append) {
        setArticles((prev) => [...prev, ...fetched]);
      } else {
        setArticles(fetched);
      }
      setHasMore(fetched.length === 20);
      offsetRef.current = offset + fetched.length;
    } catch (err) {
      console.error("Trending fetch error:", err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchTrending(0).finally(() => setLoading(false));
  }, [fetchTrending]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchTrending(offsetRef.current, true);
    setLoadingMore(false);
  }, [loadingMore, hasMore, fetchTrending]);

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

  const handleClick = (articleId: string) => {
    fetch("/api/engagement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "engagement", article_id: articleId, interaction_type: "click" }),
    });
    router.push(`/article/${articleId}`);
  };

  const handleBookmark = (articleId: string) => {
    fetch("/api/engagement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "bookmark", article_id: articleId }),
    });
  };

  const lead = articles[0];
  const rest = articles.slice(1);

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <Masthead
        persona={profile?.persona}
        displayName={profile?.display_name ?? undefined}
      />

      {/* Tagline strip */}
      <div style={{ background: "var(--paper-deep)", borderBottom: "1px solid var(--rule)", padding: "7px 24px", textAlign: "center" }}>
        <span className="font-body" style={{ fontSize: 13, fontStyle: "italic", color: "var(--ink-secondary)" }}>
          Most discussed stories from the last 48 hours — ranked by reader engagement.
        </span>
      </div>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 80 }}>
            <span className="font-mono" style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
              Calculating trending stories...
            </span>
          </div>
        ) : articles.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ height: 1, background: "var(--rule)", marginBottom: 24 }} />
            <span className="font-body" style={{ fontSize: 15, fontStyle: "italic", color: "var(--ink-tertiary)" }}>
              No trending stories at the moment.
            </span>
            <div style={{ height: 1, background: "var(--rule)", marginTop: 24 }} />
          </div>
        ) : (
          <>
            {/* Section header */}
            <div className="section-break" style={{ margin: "0 0 20px" }}>
              <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink)", whiteSpace: "nowrap" }}>
                Most Discussed Stories
              </span>
            </div>

            {/* Lead + sidebar */}
            {lead && (
              <div style={{ borderTop: "2px solid var(--ink)", display: "grid", gridTemplateColumns: "8fr 4fr", marginBottom: 32 }}>
                {/* Lead story */}
                <div
                  className="story-entry"
                  style={{ padding: "24px 24px 24px 0", borderRight: "1px solid var(--rule-heavy)", cursor: "pointer" }}
                  onClick={() => handleClick(lead.id)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--accent)" }}>
                      {getCategory(lead)}
                    </div>
                    <TrendingBadge score={lead.trending_score} rank={1} />
                  </div>
                  <div style={{ height: 2, background: "var(--accent)", marginBottom: 14 }} />
                  <h2
                    className="font-headline story-headline"
                    style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.1, color: "var(--ink)", marginBottom: 10 }}
                  >
                    {lead.title}
                  </h2>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-tertiary)", fontStyle: "italic" }}>
                      By Economic Times &middot; {timeAgo(lead.published_at)}
                    </span>
                    <span
                      className="font-mono"
                      style={{ marginLeft: "auto", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-tertiary)", cursor: "pointer" }}
                      onClick={(e) => { e.stopPropagation(); handleBookmark(lead.id); }}
                    >
                      Save
                    </span>
                  </div>
                  <p className="font-body" style={{ fontSize: 15, fontStyle: "italic", lineHeight: 1.6, color: "var(--ink-secondary)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {lead.summary}
                  </p>
                </div>

                {/* Sidebar: ranks 2–7 */}
                <div style={{ padding: "24px 0 24px 24px" }}>
                  <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink)", marginBottom: 10, paddingBottom: 6, borderBottom: "2px solid var(--ink)" }}>
                    Also Trending
                  </div>
                  {rest.slice(0, 6).map((a, i) => {
                    const s = getSentiment(a.sentiment_score);
                    return (
                      <div
                        key={a.id}
                        className="story-entry"
                        style={{ display: "flex", gap: 10, paddingBottom: 12, marginBottom: 12, borderBottom: "1px solid var(--rule)", cursor: "pointer" }}
                        onClick={() => handleClick(a.id)}
                      >
                        <div className="font-headline" style={{ fontSize: 22, fontWeight: 700, color: "var(--rule-heavy)", lineHeight: 1, flexShrink: 0, width: 24, paddingTop: 2 }}>
                          {i + 2}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="font-headline story-headline" style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3, color: "var(--ink)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: 4, transition: "color 200ms" }}>
                            {a.title}
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span className="font-mono" style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>{timeAgo(a.published_at)}</span>
                            <span className="font-mono" style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: s.color }}>{s.label}</span>
                            <span className="font-mono" style={{ fontSize: 9, letterSpacing: "0.06em", color: "var(--ink-tertiary)", marginLeft: "auto" }}>
                              Score: {a.trending_score}
                            </span>
                          </div>
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
                    More Trending Stories
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderTop: "1px solid var(--rule)" }}>
                  {rest.slice(6).map((article, i) => {
                    const s = getSentiment(article.sentiment_score);
                    const cat = getCategory(article);
                    return (
                      <div
                        key={article.id}
                        className="story-entry"
                        style={{ padding: "20px 16px", borderRight: i % 4 < 3 ? "1px solid var(--rule)" : "none", borderBottom: "1px solid var(--rule)", cursor: "pointer" }}
                        onClick={() => handleClick(article.id)}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--accent)" }}>{cat}</div>
                          <span className="font-mono" style={{ fontSize: 9, color: "var(--ink-tertiary)", letterSpacing: "0.06em" }}>
                            Score: {article.trending_score}
                          </span>
                        </div>
                        <h3
                          className="font-headline story-headline"
                          style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.3, color: "var(--ink)", marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                        >
                          {article.title}
                        </h3>
                        <p className="font-body" style={{ fontSize: 13, fontStyle: "italic", lineHeight: 1.6, color: "var(--ink-secondary)", marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {article.summary}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
                            {timeAgo(article.published_at)}
                          </span>
                          <span className="font-mono" style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: s.color }}>
                            {s.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
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
                  End of trending section
                </span>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function TrendingBadge({ score, rank }: { score: number; rank: number }) {
  return (
    <span className="font-mono" style={{
      fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase",
      color: "var(--ink-tertiary)", borderLeft: "1px solid var(--rule)", paddingLeft: 10,
    }}>
      #{rank} Trending &middot; Score: {score}
    </span>
  );
}
