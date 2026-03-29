"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import DeepBriefing from "@/components/DeepBriefing";
import StoryArcTimeline from "@/components/StoryArcTimeline";
import EngagementTracker from "@/components/EngagementTracker";
import type { BriefingResponse } from "@/lib/claude";

interface Article {
  id: string;
  title: string;
  summary: string;
  image_url?: string;
  published_at: string;
  sentiment_score: number;
}

export default function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [briefing, setBriefing] = useState<BriefingResponse | null>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchBriefing = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/briefing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ article_id: id }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Failed to load briefing");
          return;
        }

        const data = await res.json();
        setBriefing(data.briefing);
        setArticle(data.article);
        setRelated(data.related ?? []);
      } catch (err) {
        setError("Failed to fetch briefing");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBriefing();
  }, [id]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "3px solid var(--border)",
              borderTopColor: "var(--accent-primary)",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <div style={{ color: "var(--text-secondary)", fontSize: 15 }}>
            Generating deep briefing with AI...
          </div>
          <div
            style={{
              color: "var(--text-tertiary)",
              fontSize: 12,
              maxWidth: 300,
              textAlign: "center",
            }}
          >
            Our AI analyst is synthesizing multiple sources into an intelligence
            briefing. This may take a few seconds.
          </div>
          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: 40,
            maxWidth: 400,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 8,
            }}
          >
            {error}
          </div>
          <button
            onClick={() => router.push("/feed")}
            style={{
              marginTop: 16,
              padding: "10px 24px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            ← Back to Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
      }}
    >
      {/* Engagement tracker */}
      <EngagementTracker articleId={id} />

      {/* Nav bar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          borderBottom: "1px solid var(--border)",
          background: "rgba(10,10,15,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          padding: "12px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            id="back-to-feed"
            onClick={() => router.push("/feed")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            ← Feed
          </button>
          <span
            className="font-headline"
            style={{
              fontSize: 16,
              fontWeight: 600,
              background:
                "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Deep Briefing
          </span>
          <div style={{ width: 60 }} /> {/* Spacer for balance */}
        </div>
      </header>

      {/* Story Arc Timeline */}
      {related.length > 0 && article && (
        <div style={{ maxWidth: 800, margin: "24px auto 0" }}>
          <StoryArcTimeline
            articles={[article, ...related]}
            onArticleClick={(aid) => {
              if (aid !== id) router.push(`/article/${aid}`);
            }}
          />
        </div>
      )}

      {/* Briefing */}
      {briefing && article && (
        <DeepBriefing briefing={briefing} articleTitle={article.title} />
      )}

      {/* Footer spacer */}
      <div style={{ height: 80 }} />
    </div>
  );
}
