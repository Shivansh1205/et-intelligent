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
  variant?: "lead" | "secondary" | "sidebar";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getSentiment(score: number): { label: string; color: string } {
  if (score > 0.3) return { label: "BULLISH", color: "var(--accent)" };
  if (score < -0.3) return { label: "BEARISH", color: "var(--accent-secondary)" };
  return { label: "NEUTRAL", color: "var(--ink-tertiary)" };
}

function getCategory(article: Article): string {
  const tags = article.topic_tags ?? [];
  if (tags.length > 0) return tags[0].toUpperCase();
  const sectors = article.entities?.sectors ?? [];
  if (sectors.length > 0) return sectors[0].toUpperCase();
  return "BUSINESS";
}

export default function NewsCard({ article, onBookmark, onClick, variant = "secondary" }: NewsCardProps) {
  const [bookmarked, setBookmarked] = useState(false);
  const [sentimentOpen, setSentimentOpen] = useState(false);
  const sentiment = getSentiment(article.sentiment_score);
  const category = getCategory(article);
  const companies = article.entities?.companies ?? [];

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarked(true);
    onBookmark?.(article.id);
  };

  if (variant === "lead") {
    return (
      <div
        className="story-entry"
        id={`news-card-${article.id}`}
        style={{ cursor: "pointer" }}
        onClick={() => onClick?.(article.id)}
      >
        <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--accent)", marginBottom: 6 }}>
          LEAD STORY
        </div>
        <div style={{ height: 2, background: "var(--accent)", marginBottom: 14 }} />
        <h2
          className="font-headline story-headline"
          style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.1, color: "var(--ink)", marginBottom: 10 }}
        >
          {article.title}
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-tertiary)", fontStyle: "italic" }}>
            By Economic Times &middot; {timeAgo(article.published_at)}
          </span>
          <span
            style={{ marginLeft: "auto", cursor: "pointer" }}
            className="font-mono"
            onClick={(e) => { e.stopPropagation(); if (!bookmarked) handleBookmark(e); }}
          >
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: bookmarked ? "var(--accent-secondary)" : "var(--ink-tertiary)" }}>
              {bookmarked ? "Saved" : ""}
            </span>
          </span>
        </div>
        <p className="font-body" style={{ fontSize: 15, fontStyle: "italic", lineHeight: 1.6, color: "var(--ink-secondary)", marginBottom: 14, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {article.summary}
        </p>
        {article.image_url && (
          <div style={{ marginBottom: 14 }}>
            <img
              src={article.image_url}
              alt={article.title}
              style={{ width: "100%", aspectRatio: "16/7", objectFit: "cover", border: "1px solid var(--rule-heavy)", display: "block" }}
            />
            {companies[0] && (
              <div className="font-mono" style={{ fontSize: 10, color: "var(--ink-tertiary)", marginTop: 4 }}>
                {companies[0]}
              </div>
            )}
          </div>
        )}
        <p className="font-body" style={{ fontSize: 14, lineHeight: 1.75, color: "var(--ink)", textIndent: "1.5em", marginBottom: 14 }}>
          {article.summary}
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span
            className="font-mono"
            style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)", textDecoration: "underline", cursor: "pointer" }}
            onClick={(e) => { e.stopPropagation(); onClick?.(article.id); }}
          >
            Continue Reading
          </span>
          <span
            className="font-mono"
            style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-tertiary)", cursor: "pointer" }}
            onClick={(e) => { e.stopPropagation(); if (!bookmarked) handleBookmark(e); }}
          >
            {bookmarked ? "" : "Save"}
          </span>
        </div>
        <div style={{ marginTop: 10 }}>
          <span className="font-body" style={{ fontSize: 13, fontStyle: "italic", color: "var(--ink-secondary)" }}>
            The tone of this story is{" "}
          </span>
          <span
            className="font-mono"
            style={{ fontSize: 13, color: sentiment.color, cursor: "pointer", textDecoration: "underline" }}
            onClick={(e) => { e.stopPropagation(); setSentimentOpen(!sentimentOpen); }}
          >
            {sentiment.label}
          </span>
          <div className={`sentiment-annotation ${sentimentOpen ? "open" : ""}`}>
            — AI analysis based on entity mentions, market language, and directional signals in this article.
          </div>
        </div>
      </div>
    );
  }

  // Secondary variant
  return (
    <div
      className="story-entry"
      id={`news-card-${article.id}`}
      style={{ cursor: "pointer", position: "relative" }}
      onClick={() => onClick?.(article.id)}
    >
      <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--accent)", marginBottom: 6 }}>
        {category}
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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            className="font-mono"
            style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: sentiment.color, cursor: "pointer" }}
            onClick={(e) => { e.stopPropagation(); setSentimentOpen(!sentimentOpen); }}
          >
            {sentiment.label}
          </span>
          <span
            className="font-mono"
            style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: bookmarked ? "var(--accent-secondary)" : "var(--ink-tertiary)", cursor: "pointer" }}
            onClick={(e) => { e.stopPropagation(); if (!bookmarked) handleBookmark(e); }}
          >
            {bookmarked ? "Saved" : "Save"}
          </span>
        </div>
      </div>
      <div className={`sentiment-annotation ${sentimentOpen ? "open" : ""}`}>
        — AI analysis based on entity mentions, market language, and directional signals in this article.
      </div>

      {/* Hover preview */}
      <div className="story-preview">
        <div className="font-mono" style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 6 }}>{category}</div>
        <p className="font-body" style={{ fontSize: 13, lineHeight: 1.6, color: "var(--ink)", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {article.summary}
        </p>
        {companies.slice(0, 3).map((c) => (
          <span key={c} className="entity-link font-body" style={{ fontSize: 12, color: "var(--ink-secondary)", marginRight: 8 }}>{c}</span>
        ))}
      </div>
    </div>
  );
}
