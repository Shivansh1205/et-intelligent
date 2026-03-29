"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import DeepBriefing from "@/components/DeepBriefing";
import StoryArcTimeline from "@/components/StoryArcTimeline";
import EngagementTracker from "@/components/EngagementTracker";
import Masthead from "@/components/Masthead";
import type { BriefingResponse } from "@/lib/claude";

interface Article {
  id: string;
  title: string;
  summary: string;
  image_url?: string;
  published_at: string;
  sentiment_score: number;
}

export default function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [briefing, setBriefing] = useState<BriefingResponse | null>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readProgress, setReadProgress] = useState(0);
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

  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setReadProgress(total > 0 ? (scrolled / total) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div className="font-mono" style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-tertiary)", marginBottom: 8 }}>
            Composing Intelligence Briefing...
          </div>
          <div className="font-body" style={{ fontSize: 13, fontStyle: "italic", color: "var(--ink-tertiary)", maxWidth: 300 }}>
            Our AI analyst is synthesising multiple sources. This may take a few seconds.
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 40, maxWidth: 400 }}>
          <div className="font-headline" style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>{error}</div>
          <button
            onClick={() => router.push("/feed")}
            style={{
              marginTop: 16, padding: "10px 24px",
              border: "1px solid var(--ink)", background: "transparent",
              color: "var(--ink)", cursor: "pointer",
              fontFamily: "'Geist Mono', monospace", fontSize: 11,
              letterSpacing: "0.1em", textTransform: "uppercase",
            }}
          >
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      {/* Read progress */}
      <div id="read-progress" style={{ width: `${readProgress}%` }} />

      <EngagementTracker articleId={id} />

      <Masthead activeSection="" />

      {/* Back nav */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "12px 24px", borderBottom: "1px solid var(--rule)" }}>
        <button
          id="back-to-feed"
          onClick={() => router.push("/feed")}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "'Geist Mono', monospace", fontSize: 10,
            letterSpacing: "0.1em", textTransform: "uppercase",
            color: "var(--ink-tertiary)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--ink)"; e.currentTarget.style.textDecoration = "underline"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--ink-tertiary)"; e.currentTarget.style.textDecoration = "none"; }}
        >
          Back to Feed
        </button>
      </div>

      {/* Story Arc Timeline */}
      {related.length > 0 && article && (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", borderBottom: "1px solid var(--rule)" }}>
          <StoryArcTimeline
            articles={[article, ...related]}
            onArticleClick={(aid) => { if (aid !== id) router.push(`/article/${aid}`); }}
          />
        </div>
      )}

      {/* Briefing */}
      {briefing && article && (
        <DeepBriefing briefing={briefing} articleTitle={article.title} />
      )}

      <div style={{ height: 80 }} />
    </div>
  );
}
