"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import FeedGrid from "@/components/FeedGrid";
import Masthead from "@/components/Masthead";
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
  const [profile, setProfile] = useState<{ persona?: string; display_name?: string } | null>(null);
  const [graphBefore, setGraphBefore] = useState<{ entity_type: string; entity_value: string; score: number }[]>([]);
  const [graphAfter, setGraphAfter] = useState<{ entity_type: string; entity_value: string; score: number }[]>([]);
  const router = useRouter();
  const supabase = createClient();

  const fetchFeed = useCallback(async (feedMode: string) => {
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
  }, []);

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

  const handleModeChange = (section: string) => {
    if (section === "for-you" || section === "trending") {
      setMode(section);
      fetchFeed(section);
    }
  };

  const handleBookmark = async (articleId: string) => {
    await fetch("/api/engagement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "bookmark", article_id: articleId }),
    });
  };

  const handleArticleClick = (articleId: string) => {
    fetch("/api/engagement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "engagement", article_id: articleId, interaction_type: "click" }),
    });
    router.push(`/article/${articleId}`);
  };

  const refreshDebugGraph = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: graph } = await supabase
      .from("interest_graph")
      .select("entity_type, entity_value, score")
      .eq("user_id", user.id)
      .order("score", { ascending: false })
      .limit(15);
    setGraphAfter(graph ?? []);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <Masthead
        persona={profile?.persona}
        displayName={profile?.display_name ?? undefined}
        activeSection={mode}
        onSectionChange={handleModeChange}
      />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 80 }}>
            <div className="font-mono" style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
              Composing your edition...
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
            position: "fixed", bottom: 0, right: 0, width: 360,
            maxHeight: "60vh", overflowY: "auto",
            background: "var(--paper-raised)", border: "1px solid var(--rule-heavy)",
            padding: 20, zIndex: 100, fontSize: 12,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)" }}>
              Debug: Interest Graph
            </span>
            <button
              onClick={refreshDebugGraph}
              style={{
                padding: "4px 12px", border: "1px solid var(--rule-heavy)",
                background: "transparent", color: "var(--ink-secondary)",
                fontFamily: "'Geist Mono', monospace", fontSize: 10, cursor: "pointer",
                letterSpacing: "0.08em", textTransform: "uppercase",
              }}
            >
              Refresh
            </button>
          </div>
          {graphAfter.map((entry, i) => {
            const beforeEntry = graphBefore.find(b => b.entity_type === entry.entity_type && b.entity_value === entry.entity_value);
            const beforeScore = beforeEntry?.score ?? 0;
            const maxScore = 5;
            return (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span className="font-body" style={{ fontSize: 11, color: "var(--ink-secondary)" }}>{entry.entity_type}:{entry.entity_value}</span>
                  <span className="font-mono" style={{ fontSize: 10, color: "var(--ink-tertiary)" }}>{entry.score.toFixed(2)}</span>
                </div>
                <div style={{ position: "relative", height: 8, background: "var(--paper-deep)", overflow: "hidden" }}>
                  <div style={{ position: "absolute", height: "100%", width: `${(beforeScore / maxScore) * 100}%`, background: "var(--rule-heavy)" }} />
                  <div style={{ position: "absolute", height: "100%", width: `${(entry.score / maxScore) * 100}%`, background: "var(--accent)", transition: "width 0.5s ease" }} />
                </div>
              </div>
            );
          })}
          {graphAfter.length === 0 && (
            <div className="font-mono" style={{ fontSize: 10, color: "var(--ink-tertiary)", textAlign: "center", padding: 20, letterSpacing: "0.08em" }}>
              No interest graph data yet. Interact with some articles.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
