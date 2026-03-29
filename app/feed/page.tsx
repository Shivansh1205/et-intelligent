"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import FeedGrid from "@/components/FeedGrid";
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

interface InterestGraphEntry {
  entity_type: string;
  entity_value: string;
  score: number;
}

export default function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = use(searchParams);
  const debug = params.debug === "true";

  const [mode, setMode] = useState<"for-you" | "trending">("for-you");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{
    persona?: string;
    display_name?: string;
  } | null>(null);
  const [graphBefore, setGraphBefore] = useState<InterestGraphEntry[]>([]);
  const [graphAfter, setGraphAfter] = useState<InterestGraphEntry[]>([]);
  const router = useRouter();
  const supabase = createClient();

  const fetchFeed = useCallback(
    async (feedMode: string) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/feed?offset=0&limit=20&mode=${feedMode}`);
        const data = await res.json();
        setArticles(data.articles ?? []);
      } catch (err) {
        console.error("Feed fetch error:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("persona, display_name")
          .eq("id", user.id)
          .single();
        setProfile(prof);

        // Capture interest graph state for debug
        if (debug) {
          const { data: graph } = await supabase
            .from("interest_graph")
            .select("entity_type, entity_value, score")
            .eq("user_id", user.id)
            .order("score", { ascending: false })
            .limit(15);
          setGraphBefore(graph ?? []);
          setGraphAfter(graph ?? []);
        }
      }
      fetchFeed("for-you");
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleModeChange = (newMode: "for-you" | "trending") => {
    setMode(newMode);
    fetchFeed(newMode);
  };

  const handleBookmark = async (articleId: string) => {
    await fetch("/api/engagement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "bookmark", article_id: articleId }),
    });
  };

  const handleArticleClick = (articleId: string) => {
    // Fire click engagement
    fetch("/api/engagement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "engagement",
        article_id: articleId,
        interaction_type: "click",
      }),
    });
    router.push(`/article/${articleId}`);
  };

  const refreshDebugGraph = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: graph } = await supabase
      .from("interest_graph")
      .select("entity_type, entity_value, score")
      .eq("user_id", user.id)
      .order("score", { ascending: false })
      .limit(15);
    setGraphAfter(graph ?? []);
  };

  const personaEmoji: Record<string, string> = {
    investor: "📈",
    founder: "🚀",
    professional: "💼",
    student: "🎓",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
      }}
    >
      {/* Top bar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          borderBottom: "1px solid var(--border)",
          background: "rgba(10,10,15,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Left: logo + persona */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <h1
              className="font-headline"
              style={{
                fontSize: 20,
                fontWeight: 700,
                background:
                  "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ET Intelligence
            </h1>
            {profile?.persona && (
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: 999,
                  border: "1px solid var(--border)",
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  background: "var(--bg-tertiary)",
                }}
              >
                {personaEmoji[profile.persona] ?? "👤"}{" "}
                {profile.persona}
              </span>
            )}
          </div>

          {/* Center: mode toggle */}
          <div
            style={{
              display: "flex",
              background: "var(--bg-secondary)",
              borderRadius: 10,
              border: "1px solid var(--border)",
              padding: 3,
            }}
          >
            {(["for-you", "trending"] as const).map((m) => (
              <button
                key={m}
                id={`mode-${m}`}
                onClick={() => handleModeChange(m)}
                style={{
                  padding: "6px 20px",
                  borderRadius: 8,
                  border: "none",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  background:
                    mode === m ? "var(--accent-primary)" : "transparent",
                  color: mode === m ? "#fff" : "var(--text-tertiary)",
                }}
              >
                {m === "for-you" ? "For You" : "Trending"}
              </button>
            ))}
          </div>

          {/* Right: avatar */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {profile?.display_name?.[0]?.toUpperCase() ?? "U"}
          </div>
        </div>
      </header>

      {/* Feed content */}
      <main
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "32px 24px",
        }}
      >
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 400,
              color: "var(--text-tertiary)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "3px solid var(--border)",
                  borderTopColor: "var(--accent-primary)",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <span style={{ fontSize: 14 }}>
                Personalizing your feed...
              </span>
              <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
              `}</style>
            </div>
          </div>
        ) : articles.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 80,
              color: "var(--text-tertiary)",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>📰</div>
            <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>
              No articles yet
            </div>
            <div style={{ fontSize: 14 }}>
              Seed some articles via the /api/seed endpoint to get started.
            </div>
          </div>
        ) : (
          <FeedGrid
            initialArticles={articles}
            mode={mode}
            onBookmark={handleBookmark}
            onArticleClick={handleArticleClick}
          />
        )}
      </main>

      {/* Debug panel */}
      {debug && (
        <div
          id="debug-panel"
          style={{
            position: "fixed",
            bottom: 0,
            right: 0,
            width: 380,
            maxHeight: "60vh",
            overflowY: "auto",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "16px 0 0 0",
            padding: 20,
            zIndex: 100,
            fontSize: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <span
              className="font-mono"
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--accent-primary)",
              }}
            >
              🔧 Debug: Interest Graph
            </span>
            <button
              onClick={refreshDebugGraph}
              style={{
                padding: "4px 12px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-secondary)",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              Refresh
            </button>
          </div>

          {/* Bar chart */}
          {graphAfter.map((entry, i) => {
            const beforeEntry = graphBefore.find(
              (b) =>
                b.entity_type === entry.entity_type &&
                b.entity_value === entry.entity_value
            );
            const beforeScore = beforeEntry?.score ?? 0;
            const maxScore = 5;

            return (
              <div key={i} style={{ marginBottom: 10 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 3,
                  }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>
                    {entry.entity_type}:{entry.entity_value}
                  </span>
                  <span
                    className="font-mono"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {entry.score.toFixed(2)}
                  </span>
                </div>
                <div
                  style={{
                    position: "relative",
                    height: 12,
                    background: "var(--bg-tertiary)",
                    borderRadius: 6,
                    overflow: "hidden",
                  }}
                >
                  {/* Before bar */}
                  <div
                    style={{
                      position: "absolute",
                      height: "100%",
                      width: `${(beforeScore / maxScore) * 100}%`,
                      background: "rgba(107,114,128,0.3)",
                      borderRadius: 6,
                    }}
                  />
                  {/* After bar */}
                  <div
                    style={{
                      position: "absolute",
                      height: "100%",
                      width: `${(entry.score / maxScore) * 100}%`,
                      background:
                        "linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))",
                      borderRadius: 6,
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
              </div>
            );
          })}

          {graphAfter.length === 0 && (
            <div style={{ color: "var(--text-tertiary)", textAlign: "center", padding: 20 }}>
              No interest graph data yet. Interact with some articles!
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 12,
              fontSize: 10,
              color: "var(--text-tertiary)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div
                style={{
                  width: 10,
                  height: 6,
                  borderRadius: 2,
                  background: "rgba(107,114,128,0.3)",
                }}
              />
              Before session
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div
                style={{
                  width: 10,
                  height: 6,
                  borderRadius: 2,
                  background: "var(--accent-primary)",
                }}
              />
              After session
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
