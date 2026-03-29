"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import NewsCard from "./NewsCard";

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

interface FeedGridProps {
  initialArticles: Article[];
  mode: "for-you" | "trending";
  onBookmark: (articleId: string) => void;
  onArticleClick: (articleId: string) => void;
}

function getSentiment(score: number) {
  if (score > 0.3) return { label: "BULLISH", color: "var(--accent)" };
  if (score < -0.3) return { label: "BEARISH", color: "var(--accent-secondary)" };
  return { label: "NEUTRAL", color: "var(--ink-tertiary)" };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return "Earlier today";
  if (hrs < 24) return "Earlier today";
  return "Yesterday";
}

export default function FeedGrid({ initialArticles, mode, onBookmark, onArticleClick }: FeedGridProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [batches, setBatches] = useState<{ label: string; articles: Article[] }[]>([]);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(initialArticles.length);

  useEffect(() => {
    setArticles(initialArticles);
    setBatches([]);
    offsetRef.current = initialArticles.length;
    setHasMore(initialArticles.length >= 20);
  }, [initialArticles, mode]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/feed?offset=${offsetRef.current}&limit=20&mode=${mode}`);
      const data = await res.json();
      const newArticles: Article[] = data.articles ?? [];
      if (newArticles.length === 0) {
        setHasMore(false);
      } else {
        const label = offsetRef.current < 40 ? "Earlier Today" : "Yesterday";
        setBatches((prev) => [...prev, { label, articles: newArticles }]);
        offsetRef.current += newArticles.length;
      }
    } catch (err) {
      console.error("Load more failed:", err);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, mode]);

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

  if (articles.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <div className="font-mono" style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
          No articles yet. Seed some articles via the /api/seed endpoint to get started.
        </div>
      </div>
    );
  }

  const lead = articles[0];
  const sidebarBriefings = articles.slice(1, 4);
  const watchlistArticles = articles.slice(4, 7);
  const trendingArticles = articles.slice(7, 12);
  const secondaryArticles = articles.slice(12);

  return (
    <div>
      {/* ABOVE THE FOLD */}
      <div style={{ borderTop: "2px solid var(--ink)", display: "grid", gridTemplateColumns: "8fr 4fr" }}>
        {/* Lead story */}
        <div style={{ padding: "24px 24px 24px 0", borderRight: "1px solid var(--rule-heavy)" }}>
          <NewsCard article={lead} onBookmark={onBookmark} onClick={onArticleClick} variant="lead" />
        </div>

        {/* Right sidebar */}
        <div style={{ padding: "24px 0 24px 24px" }}>
          {/* Intelligence Briefings */}
          <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink)", marginBottom: 10, paddingBottom: 6, borderBottom: "2px solid var(--ink)" }}>
            Intelligence Briefings
          </div>
          {sidebarBriefings.map((a, i) => {
            const cat = (a.topic_tags?.[0] ?? a.entities?.sectors?.[0] ?? "business").toUpperCase();
            return (
              <div key={a.id} style={{ paddingBottom: 12, marginBottom: 12, borderBottom: "1px solid var(--rule)", cursor: "pointer" }} onClick={() => onArticleClick(a.id)}>
                <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.1em", color: "var(--accent)", marginBottom: 4 }}>{cat}</div>
                <div className="font-headline story-headline story-entry" style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3, color: "var(--ink)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", transition: "color 200ms" }}>
                  {a.title}
                </div>
                <div className="font-mono" style={{ fontSize: 10, color: "var(--ink-tertiary)", marginTop: 4 }}>1 article synthesised</div>
              </div>
            );
          })}

          {/* Your Watchlist */}
          <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink)", marginBottom: 10, paddingBottom: 6, borderBottom: "2px solid var(--ink)", marginTop: 20 }}>
            Your Watchlist
          </div>
          {watchlistArticles.map((a) => {
            const company = a.entities?.companies?.[0] ?? "Company";
            const sentiment = getSentiment(a.sentiment_score);
            return (
              <div key={a.id} style={{ paddingBottom: 10, marginBottom: 10, borderBottom: "1px solid var(--rule)", cursor: "pointer" }} onClick={() => onArticleClick(a.id)}>
                <div className="font-mono" style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink)", marginBottom: 3 }}>{company}</div>
                <div className="font-body" style={{ fontSize: 13, color: "var(--ink-secondary)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.title}</div>
                <div className="font-mono" style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: sentiment.color, marginTop: 3 }}>{sentiment.label}</div>
              </div>
            );
          })}

          {/* Trending Today */}
          <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink)", marginBottom: 10, paddingBottom: 6, borderBottom: "2px solid var(--ink)", marginTop: 20 }}>
            Trending Today
          </div>
          {trendingArticles.slice(0, 5).map((a, i) => (
            <div key={a.id} style={{ display: "flex", gap: 10, paddingBottom: 10, marginBottom: 10, borderBottom: "1px solid var(--rule)", cursor: "pointer" }} onClick={() => onArticleClick(a.id)}>
              <div className="font-headline" style={{ fontSize: 24, fontWeight: 700, color: "var(--rule-heavy)", lineHeight: 1, flexShrink: 0, width: 24 }}>{i + 1}</div>
              <div className="font-body story-entry" style={{ fontSize: 13, lineHeight: 1.4, color: "var(--ink)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                <span className="story-headline" style={{ transition: "color 200ms" }}>{a.title}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BELOW THE FOLD */}
      {secondaryArticles.length > 0 && (
        <>
          <div style={{ margin: "32px 0 24px" }}>
            <div className="section-break">
              <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink)", whiteSpace: "nowrap" }}>
                More Stories
              </span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderTop: "1px solid var(--rule)" }}>
            {secondaryArticles.map((article, i) => (
              <div
                key={article.id}
                style={{
                  padding: "20px 16px",
                  borderRight: i % 4 < 3 ? "1px solid var(--rule)" : "none",
                  borderBottom: "1px solid var(--rule)",
                }}
              >
                <NewsCard article={article} onBookmark={onBookmark} onClick={onArticleClick} variant="secondary" />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Infinite scroll batches */}
      {batches.map((batch, bi) => (
        <div key={bi}>
          <div style={{ margin: "32px 0 24px" }}>
            <div className="section-break">
              <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink)", whiteSpace: "nowrap", fontStyle: "italic" }}>
                {batch.label}
              </span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderTop: "1px solid var(--rule)" }}>
            {batch.articles.map((article, i) => (
              <div key={article.id} style={{ padding: "20px 16px", borderRight: i % 4 < 3 ? "1px solid var(--rule)" : "none", borderBottom: "1px solid var(--rule)" }}>
                <NewsCard article={article} onBookmark={onBookmark} onClick={onArticleClick} variant="secondary" />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div ref={sentinelRef} style={{ height: 1 }} />

      {loading && (
        <div style={{ textAlign: "center", padding: 24 }}>
          <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
            Loading more stories...
          </span>
        </div>
      )}

      {!hasMore && articles.length > 0 && (
        <div style={{ textAlign: "center", padding: 32, borderTop: "1px solid var(--rule)" }}>
          <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
            End of edition
          </span>
        </div>
      )}
    </div>
  );
}
