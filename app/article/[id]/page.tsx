"use client";

import { useEffect, useState, useCallback } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import DeepBriefing from "@/components/DeepBriefing";
import StoryArcTimeline from "@/components/StoryArcTimeline";
import EngagementTracker from "@/components/EngagementTracker";
import Masthead from "@/components/Masthead";
import FutureSimulation from "@/components/FutureSimulation";
import DecisionInsights from "@/components/DecisionInsights";
import ContradictionBanner from "@/components/ContradictionBanner";
import { createClient } from "@/lib/supabase/client";
import type { BriefingResponse } from "@/lib/claude";
import type { SimulationResult } from "@/lib/simulation";
import type { DecisionResult } from "@/lib/decision";
import type { ContradictionResult } from "@/lib/contradiction";

interface Article {
  id: string;
  title: string;
  summary: string;
  image_url?: string;
  published_at: string;
  sentiment_score: number;
  entities?: Record<string, string[]>;
}

export default function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();

  // Core briefing state
  const [briefing, setBriefing] = useState<BriefingResponse | null>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Intelligence features state
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  const [decisionInsights, setDecisionInsights] = useState<DecisionResult | null>(null);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [decisionMode, setDecisionMode] = useState(false);
  const [persona, setPersona] = useState("professional");

  const [contradiction, setContradiction] = useState<ContradictionResult | null>(null);
  const [contradictionLoading, setContradictionLoading] = useState(false);

  // Read progress
  const [readProgress, setReadProgress] = useState(0);

  // Fetch user persona on mount
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("persona")
          .eq("id", user.id)
          .single();
        if (prof?.persona) setPersona(prof.persona);
      }
    };
    init();
    // Restore decision mode from localStorage
    try {
      if (localStorage.getItem("et-decision-mode") === "true") setDecisionMode(true);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch briefing
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

  // Fetch simulation once briefing is ready
  useEffect(() => {
    if (!briefing || !id) return;
    const fetchSimulation = async () => {
      setSimLoading(true);
      try {
        const res = await fetch("/api/simulation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ article_id: id, briefing }),
        });
        if (res.ok) {
          const data = await res.json();
          setSimulation(data.simulation);
        }
      } catch {}
      finally { setSimLoading(false); }
    };
    fetchSimulation();
  }, [briefing, id]);

  // Fetch contradiction once related articles are ready
  useEffect(() => {
    if (!id || related.length < 1) return;
    const allArticles = article ? [article, ...related] : related;
    if (allArticles.length < 2) return;
    const fetchContradiction = async () => {
      setContradictionLoading(true);
      try {
        const res = await fetch("/api/contradiction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            article_id: id,
            articles: allArticles.map((a) => ({
              title: a.title,
              summary: a.summary,
              sentiment_score: a.sentiment_score,
            })),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setContradiction(data.contradiction);
        }
      } catch {}
      finally { setContradictionLoading(false); }
    };
    fetchContradiction();
  }, [id, article, related]);

  // Fetch decision insights when decision mode is toggled on
  const fetchDecisionInsights = useCallback(async () => {
    if (!article || !id) return;
    setDecisionLoading(true);
    try {
      const res = await fetch("/api/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article_id: id,
          article: {
            title: article.title,
            summary: article.summary,
            entities: article.entities ?? {},
          },
          persona,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDecisionInsights(data.insights);
      }
    } catch {}
    finally { setDecisionLoading(false); }
  }, [article, id, persona]);

  useEffect(() => {
    if (decisionMode && !decisionInsights && article) {
      fetchDecisionInsights();
    }
  }, [decisionMode, article, decisionInsights, fetchDecisionInsights]);

  const toggleDecisionMode = () => {
    const next = !decisionMode;
    setDecisionMode(next);
    try { localStorage.setItem("et-decision-mode", String(next)); } catch {}
  };

  // Read progress
  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      setReadProgress(total > 0 ? (el.scrollTop / total) * 100 : 0);
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
        <div style={{ textAlign: "center", padding: 40 }}>
          <div className="font-headline" style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", marginBottom: 16 }}>{error}</div>
          <button
            onClick={() => router.push("/feed")}
            style={{
              padding: "10px 24px", border: "1px solid var(--ink)", background: "transparent",
              color: "var(--ink)", cursor: "pointer",
              fontFamily: "'Geist Mono', monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
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
      <div id="read-progress" style={{ width: `${readProgress}%` }} />
      <EngagementTracker articleId={id} />
      <Masthead activeSection="" />

      {/* Back nav + Decision Mode toggle */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "12px 24px", borderBottom: "1px solid var(--rule)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button
          id="back-to-feed"
          onClick={() => router.push("/feed")}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "'Geist Mono', monospace", fontSize: 10,
            letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-tertiary)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--ink)"; e.currentTarget.style.textDecoration = "underline"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--ink-tertiary)"; e.currentTarget.style.textDecoration = "none"; }}
        >
          Back to Feed
        </button>

        {/* Decision Mode toggle */}
        <button
          onClick={toggleDecisionMode}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "'Geist Mono', monospace", fontSize: 10,
            letterSpacing: "0.1em", textTransform: "uppercase",
            color: decisionMode ? "var(--ink)" : "var(--ink-tertiary)",
            borderBottom: decisionMode ? "1px solid var(--ink)" : "1px solid transparent",
            paddingBottom: 2,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--ink)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = decisionMode ? "var(--ink)" : "var(--ink-tertiary)"; }}
        >
          {decisionMode ? "Decision Mode: On" : "Decision Mode: Off"}
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
        {/* Contradiction banner — above briefing */}
        <div style={{ paddingTop: 20 }}>
          <ContradictionBanner contradiction={contradiction} loading={contradictionLoading} />
        </div>

        {/* Decision Insights — below headline, above briefing body */}
        {decisionMode && (
          <DecisionInsights insights={decisionInsights} loading={decisionLoading} persona={persona} />
        )}
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

      {/* Main briefing */}
      {briefing && article && (
        <DeepBriefing briefing={briefing} articleTitle={article.title} />
      )}

      {/* Future Simulation — below briefing */}
      {briefing && (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
          <FutureSimulation simulation={simulation} loading={simLoading} />
        </div>
      )}

      <div style={{ height: 80 }} />
    </div>
  );
}
