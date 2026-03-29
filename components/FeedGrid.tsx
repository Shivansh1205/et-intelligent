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

export default function FeedGrid({
  initialArticles,
  mode,
  onBookmark,
  onArticleClick,
}: FeedGridProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(initialArticles.length);

  // Reset when mode or initial articles change
  useEffect(() => {
    setArticles(initialArticles);
    offsetRef.current = initialArticles.length;
    setHasMore(initialArticles.length >= 20);
  }, [initialArticles, mode]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const res = await fetch(
        `/api/feed?offset=${offsetRef.current}&limit=20&mode=${mode}`
      );
      const data = await res.json();
      const newArticles: Article[] = data.articles ?? [];

      if (newArticles.length === 0) {
        setHasMore(false);
      } else {
        setArticles((prev) => [...prev, ...newArticles]);
        offsetRef.current += newArticles.length;
      }
    } catch (err) {
      console.error("Load more failed:", err);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, mode]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div>
      <div
        id="feed-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
        }}
      >
        {articles.map((article) => (
          <NewsCard
            key={article.id}
            article={article}
            onBookmark={onBookmark}
            onClick={onArticleClick}
          />
        ))}
      </div>

      {/* Responsive override */}
      <style>{`
        @media (max-width: 1024px) {
          #feed-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          #feed-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} style={{ height: 1 }} />

      {loading && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: 32,
            color: "var(--text-tertiary)",
            fontSize: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                border: "2px solid var(--border)",
                borderTopColor: "var(--accent-primary)",
                animation: "spin 0.8s linear infinite",
              }}
            />
            Loading more stories...
          </div>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {!hasMore && articles.length > 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 32,
            color: "var(--text-tertiary)",
            fontSize: 13,
          }}
        >
          You&apos;re all caught up 🎯
        </div>
      )}
    </div>
  );
}
