"use client";

import { useState } from "react";

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

interface NewsCardProps {
  article: Article;
  onBookmark?: (id: string) => void;
  onClick?: (id: string) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getSentimentBadge(score: number) {
  if (score > 0.3) return { label: "Bullish", color: "var(--positive)", bg: "rgba(16,185,129,0.1)" };
  if (score < -0.3) return { label: "Bearish", color: "var(--negative)", bg: "rgba(239,68,68,0.1)" };
  return { label: "Neutral", color: "var(--neutral)", bg: "rgba(107,114,128,0.1)" };
}

export default function NewsCard({ article, onBookmark, onClick }: NewsCardProps) {
  const [bookmarked, setBookmarked] = useState(false);
  const sentiment = getSentimentBadge(article.sentiment_score);
  const entities = article.entities ?? {};
  const allTags = [
    ...(entities.companies ?? []).slice(0, 2),
    ...(entities.sectors ?? []).slice(0, 1),
  ];
  const relevance = article.relevance_score ?? 0;
  const maxRelevance = 10;
  const relevancePct = Math.min(100, Math.max(0, (relevance / maxRelevance) * 100));

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarked(!bookmarked);
    onBookmark?.(article.id);
  };

  return (
    <div
      id={`news-card-${article.id}`}
      onClick={() => onClick?.(article.id)}
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.25s ease",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Image or gradient header */}
      {article.image_url ? (
        <div
          style={{
            height: 160,
            backgroundImage: `url(${article.image_url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(transparent 50%, var(--bg-secondary) 100%)",
            }}
          />
        </div>
      ) : (
        <div
          style={{
            height: 80,
            background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))",
          }}
        />
      )}

      <div style={{ padding: "16px 20px 20px" }}>
        {/* Source + time */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <span
            className="font-mono"
            style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}
          >
            {timeAgo(article.published_at)}
          </span>
          <div
            style={{
              padding: "3px 10px",
              borderRadius: 999,
              background: sentiment.bg,
              color: sentiment.color,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {sentiment.label}
          </div>
        </div>

        {/* Title */}
        <h3
          className="font-headline"
          style={{
            fontSize: 17,
            fontWeight: 600,
            lineHeight: 1.35,
            color: "var(--text-primary)",
            marginBottom: 10,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {article.title}
        </h3>

        {/* Summary */}
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.6,
            color: "var(--text-secondary)",
            marginBottom: 14,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {article.summary}
        </p>

        {/* Entity tags */}
        {allTags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            {allTags.map((tag) => (
              <span
                key={tag}
                style={{
                  padding: "3px 10px",
                  borderRadius: 999,
                  border: "1px solid var(--border)",
                  fontSize: 11,
                  color: "var(--text-tertiary)",
                  background: "var(--bg-tertiary)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Bottom row: relevance bar + bookmark */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Relevance bar */}
          <div style={{ flex: 1, marginRight: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 3,
              }}
            >
              <span style={{ fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Relevance
              </span>
            </div>
            <div
              style={{
                height: 3,
                background: "var(--bg-tertiary)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${relevancePct}%`,
                  background: "linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))",
                  borderRadius: 2,
                  transition: "width 0.5s ease",
                }}
              />
            </div>
          </div>

          {/* Bookmark */}
          <button
            id={`bookmark-${article.id}`}
            onClick={handleBookmark}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 18,
              padding: 4,
              transition: "transform 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {bookmarked ? "🔖" : "🏷️"}
          </button>
        </div>
      </div>
    </div>
  );
}
