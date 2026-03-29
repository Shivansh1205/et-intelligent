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
  if (score > 0.3) return "var(--positive)";
  if (score < -0.3) return "var(--negative)";
  return "var(--neutral)";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StoryArcTimeline({
  articles,
  onArticleClick,
}: StoryArcTimelineProps) {
  if (!articles || articles.length === 0) return null;

  const sorted = [...articles].sort(
    (a, b) =>
      new Date(a.published_at).getTime() - new Date(b.published_at).getTime()
  );

  return (
    <div id="story-arc-timeline" style={{ marginBottom: 32 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--accent-primary)",
          marginBottom: 16,
          paddingLeft: 24,
        }}
      >
        Story Timeline
      </div>

      <div
        className="snap-x"
        style={{
          display: "flex",
          overflowX: "auto",
          gap: 16,
          paddingBottom: 16,
          paddingLeft: 24,
          paddingRight: 24,
          position: "relative",
        }}
      >
        {sorted.map((article, i) => {
          const color = getSentimentColor(article.sentiment_score);
          const nextColor =
            i < sorted.length - 1
              ? getSentimentColor(sorted[i + 1].sentiment_score)
              : color;

          return (
            <div
              key={article.id}
              className="snap-start"
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                minWidth: 200,
                maxWidth: 240,
                flexShrink: 0,
              }}
            >
              {/* Connecting line */}
              {i < sorted.length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    left: "50%",
                    width: "calc(100% + 16px)",
                    height: 3,
                    background: `linear-gradient(90deg, ${color}, ${nextColor})`,
                    opacity: 0.4,
                    borderRadius: 2,
                  }}
                />
              )}

              {/* Dot */}
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: color,
                  boxShadow: `0 0 12px ${color}`,
                  border: "3px solid var(--bg-primary)",
                  zIndex: 1,
                  marginBottom: 12,
                  flexShrink: 0,
                }}
              />

              {/* Card */}
              <div
                onClick={() => onArticleClick?.(article.id)}
                style={{
                  padding: 14,
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--bg-secondary)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  width: "100%",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = color;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div
                  className="font-mono"
                  style={{
                    fontSize: 10,
                    color: "var(--text-tertiary)",
                    marginBottom: 6,
                  }}
                >
                  {formatDate(article.published_at)}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    lineHeight: 1.35,
                    color: "var(--text-primary)",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {article.title}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
