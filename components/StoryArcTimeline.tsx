"use client";

interface TimelineArticle {
  id: string;
  title: string;
  summary?: string;
  published_at: string;
  sentiment_score: number;
}

interface StoryArcTimelineProps {
  articles: TimelineArticle[];
  onArticleClick?: (id: string) => void;
}

function getSentimentColor(score: number): string {
  if (score > 0.3) return "var(--accent-secondary)";
  if (score < -0.3) return "var(--accent)";
  return "var(--ink-tertiary)";
}

function getSentimentLabel(score: number): string {
  if (score > 0.3) return "BULLISH";
  if (score < -0.3) return "BEARISH";
  return "NEUTRAL";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short",
  }).toUpperCase();
}

export default function StoryArcTimeline({ articles, onArticleClick }: StoryArcTimelineProps) {
  if (!articles || articles.length === 0) return null;

  const sorted = [...articles].sort(
    (a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime()
  );

  return (
    <div id="story-arc-timeline" style={{ padding: "32px 0" }}>
      <div className="section-break" style={{ marginBottom: 24 }}>
        <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink)", whiteSpace: "nowrap" }}>
          The Story So Far
        </span>
      </div>

      <div
        className="snap-x"
        style={{ display: "flex", overflowX: "auto", paddingBottom: 16, position: "relative" }}
      >
        {/* Connecting line */}
        <div style={{
          position: "absolute",
          top: 20,
          left: 0,
          right: 0,
          height: 1,
          background: "var(--rule)",
          zIndex: 0,
        }} />

        {sorted.map((article, i) => {
          const color = getSentimentColor(article.sentiment_score);
          const label = getSentimentLabel(article.sentiment_score);
          return (
            <div
              key={article.id}
              className="snap-start"
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                minWidth: 180,
                maxWidth: 200,
                flexShrink: 0,
                paddingRight: i < sorted.length - 1 ? 16 : 0,
                zIndex: 1,
              }}
            >
              {/* Date */}
              <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.1em", color: "var(--ink-tertiary)", marginBottom: 8, textAlign: "center" }}>
                {formatDate(article.published_at)}
              </div>

              {/* Square dot */}
              <div style={{
                width: 8, height: 8,
                background: color,
                flexShrink: 0,
                marginBottom: 12,
                zIndex: 2,
              }} />

              {/* Card */}
              <div
                onClick={() => onArticleClick?.(article.id)}
                style={{ cursor: "pointer", width: "100%", padding: "0 8px" }}
              >
                <div
                  className="font-headline story-entry"
                  style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3, color: "var(--ink)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: 6 }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--ink)"; }}
                >
                  {article.title}
                </div>
                <div className="font-mono" style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color }}>
                  {label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
