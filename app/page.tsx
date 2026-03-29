"use client";

import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
    });
  };

  const handleMagicLink = async () => {
    const email = prompt("Enter your email address:");
    if (!email) return;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/onboarding` },
    });
    if (!error) alert("Check your inbox for the magic link!");
    else alert("Error: " + error.message);
  };

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).toUpperCase();

  const teaserArticles = [
    {
      category: "MARKETS",
      headline: "Sensex Surges Past 80,000 as Foreign Investors Return to Indian Equities",
      standfirst: "A wave of foreign institutional buying pushed benchmark indices to record highs, with banking and technology stocks leading the advance amid easing global rate concerns.",
    },
    {
      category: "STARTUPS",
      headline: "Zepto Raises $350 Million in Series F, Valuation Crosses $5 Billion",
      standfirst: "The quick-commerce startup's latest fundraise signals continued investor confidence in India's rapid delivery sector despite mounting competition from Swiggy Instamart and Blinkit.",
    },
    {
      category: "POLICY",
      headline: "RBI Holds Rates Steady, Signals Pivot Possible in Second Half of 2026",
      standfirst: "The central bank's monetary policy committee voted unanimously to maintain the repo rate at 6.5 percent, while revising its growth forecast upward to 7.2 percent for the fiscal year.",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      {/* Masthead (static, no interactivity) */}
      <header style={{ background: "var(--paper)", borderBottom: "1px solid var(--rule)" }}>
        {/* Dateline */}
        <div style={{
          height: 28, background: "var(--ink)", color: "var(--paper)",
          display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px",
        }}>
          <span className="font-mono" style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase" }}>Mumbai, India</span>
          <span className="font-mono" style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase" }}>{today}</span>
          <span className="font-mono" style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase" }}>Your Personalised Edition</span>
        </div>
        {/* Nameplate */}
        <div style={{
          height: 80, borderBottom: "3px solid var(--ink)", borderTop: "1px solid var(--ink)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{
            fontFamily: "'UnifrakturMaguntia', cursive",
            fontSize: 52, color: "var(--ink)", lineHeight: 1,
          }}>
            ET Intelligence
          </span>
        </div>
        {/* Section nav — greyed out */}
        <div style={{
          height: 32, borderBottom: "1px solid var(--rule-heavy)",
          display: "flex", alignItems: "center", padding: "0 8px",
        }}>
          {["For You", "Trending", "Markets", "Startups", "Policy", "Bookmarks"].map((s, i, arr) => (
            <span key={s} style={{
              borderRight: i < arr.length - 1 ? "1px solid var(--rule-heavy)" : "none",
              padding: "0 16px", height: "100%", display: "flex", alignItems: "center",
              fontFamily: "'Geist Mono', monospace", fontSize: 10, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "var(--rule-heavy)",
            }}>{s}</span>
          ))}
        </div>
      </header>

      {/* Blurred teaser + overlay */}
      <div style={{ position: "relative", padding: "32px 24px", maxWidth: 1200, margin: "0 auto" }}>
        {/* Blurred articles */}
        <div style={{ filter: "blur(4px)", userSelect: "none", pointerEvents: "none" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 0, borderTop: "2px solid var(--ink)" }}>
            {teaserArticles.map((a, i) => (
              <div key={i} style={{
                padding: "24px 20px",
                borderRight: i < 2 ? "1px solid var(--rule)" : "none",
              }}>
                <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--accent)", marginBottom: 8 }}>
                  {a.category}
                </div>
                <div style={{ height: 2, background: "var(--accent)", marginBottom: 12 }} />
                <h2 className="font-headline" style={{ fontSize: i === 0 ? 28 : 20, fontWeight: 700, lineHeight: 1.2, color: "var(--ink)", marginBottom: 12 }}>
                  {a.headline}
                </h2>
                <p className="font-body" style={{ fontSize: 14, fontStyle: "italic", lineHeight: 1.6, color: "var(--ink-secondary)" }}>
                  {a.standfirst}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Overlay */}
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
          background: "var(--paper)",
          border: "1px solid var(--ink)",
          padding: 40,
          textAlign: "center",
          zIndex: 10,
        }}>
          <h2 className="font-headline" style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)", marginBottom: 12, lineHeight: 1.3 }}>
            Subscribe to your personal edition
          </h2>
          <p className="font-body" style={{ fontSize: 14, fontStyle: "italic", color: "var(--ink-secondary)", lineHeight: 1.6, marginBottom: 28 }}>
            Join ET Intelligence and get business news tailored to who you are, not who the algorithm thinks you are.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={handleGoogleLogin}
              style={{
                width: "100%", height: 44, background: "var(--ink)", color: "var(--paper)",
                border: "none", cursor: "pointer",
                fontFamily: "'Geist Mono', monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--ink)"; }}
            >
              Sign in with Google
            </button>
            <button
              onClick={handleMagicLink}
              style={{
                width: "100%", height: 44, background: "transparent", color: "var(--ink)",
                border: "1px solid var(--ink)", cursor: "pointer",
                fontFamily: "'Geist Mono', monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--paper-deep)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              Sign in with Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
