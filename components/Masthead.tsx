"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface MastheadProps {
  persona?: string;
  displayName?: string;
  activeSection?: string;
  tickerItems?: { name: string; sentiment: number; label: string }[];
  onSectionChange?: (section: string) => void;
}

function getToday() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).toUpperCase();
}

export default function Masthead({
  persona,
  displayName,
  activeSection = "for-you",
  tickerItems = [],
  onSectionChange,
}: MastheadProps) {
  const [isNight, setIsNight] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsNight(document.documentElement.classList.contains("theme-night"));
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (isNight) {
      html.classList.remove("theme-night");
      html.classList.add("theme-day");
      localStorage.setItem("et-theme", "theme-day");
      setIsNight(false);
    } else {
      html.classList.remove("theme-day");
      html.classList.add("theme-night");
      localStorage.setItem("et-theme", "theme-night");
      setIsNight(true);
    }
  };

  const sections = [
    { id: "for-you", label: "For You" },
    { id: "trending", label: "Trending" },
    { id: "markets", label: "Markets" },
    { id: "startups", label: "Startups" },
    { id: "policy", label: "Policy" },
    { id: "bookmarks", label: "Bookmarks" },
  ];

  const initials = displayName
    ? displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  const personaLabel = persona
    ? persona.charAt(0).toUpperCase() + persona.slice(1)
    : "Reader";

  const defaultTicker = [
    { name: "ZOMATO", sentiment: 0.5, label: "BULLISH" },
    { name: "HDFC BANK", sentiment: 0, label: "NEUTRAL" },
    { name: "PAYTM", sentiment: -0.5, label: "BEARISH" },
    { name: "INFOSYS", sentiment: 0.4, label: "BULLISH" },
    { name: "RELIANCE", sentiment: 0.2, label: "BULLISH" },
    { name: "ZEPTO", sentiment: -0.1, label: "NEUTRAL" },
  ];

  const ticker = tickerItems.length > 0 ? tickerItems.map(t => ({
    name: t.name,
    sentiment: t.sentiment,
    label: t.label,
  })) : defaultTicker;

  const tickerStr = [...ticker, ...ticker].map(t => {
    const col = t.sentiment > 0.3 ? "var(--accent)" : t.sentiment < -0.3 ? "var(--accent-secondary)" : "var(--ink-tertiary)";
    return `<span style="color:${col}">${t.name}&nbsp;&nbsp;${t.label}</span>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;`;
  }).join("");

  return (
    <header style={{ background: "var(--paper)", borderBottom: "1px solid var(--rule)" }}>
      {/* Row 1: Dateline */}
      <div style={{
        height: 28,
        background: "var(--ink)",
        color: "var(--paper)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
      }}>
        <span className="font-mono" style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase" }}>
          Mumbai, India
        </span>
        <span className="font-mono" style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase" }}>
          {getToday()}
        </span>
        <span className="font-mono" style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase" }}>
          Your Personalised Edition
        </span>
      </div>

      {/* Row 2: Nameplate */}
      <div style={{
        height: 80,
        borderBottom: "3px solid var(--ink)",
        borderTop: "1px solid var(--ink)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        position: "relative",
      }}>
        {/* Left: persona */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 120 }}>
          <span className="font-mono" style={{ fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
            Edition For
          </span>
          <span className="font-mono" style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink)" }}>
            {personaLabel}s
          </span>
        </div>

        {/* Center: masthead title */}
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
          <button
            onClick={() => router.push("/feed")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              fontFamily: isNight ? "'Playfair Display', serif" : "'UnifrakturMaguntia', cursive",
              fontSize: isNight ? 44 : 52,
              fontWeight: isNight ? 700 : 400,
              color: "var(--ink)",
              lineHeight: 1,
              letterSpacing: isNight ? "-0.02em" : "0",
            }}
          >
            ET Intelligence
          </button>
        </div>

        {/* Right: theme toggle + avatar */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, minWidth: 120 }}>
          <button
            onClick={toggleTheme}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "'Geist Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--ink-tertiary)",
              padding: 0,
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--ink)";
              e.currentTarget.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--ink-tertiary)";
              e.currentTarget.style.textDecoration = "none";
            }}
          >
            {isNight ? "Day Edition" : "Night Edition"}
          </button>
          {pathname !== "/" && (
            <div style={{
              width: 28,
              height: 28,
              background: "var(--ink)",
              color: "var(--paper)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Geist Mono', monospace",
              fontSize: 11,
              fontWeight: 500,
            }}>
              {initials}
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Section nav */}
      <div style={{
        height: 32,
        borderBottom: "1px solid var(--rule-heavy)",
        display: "flex",
        alignItems: "center",
        padding: "0 8px",
        overflowX: "auto",
      }}>
        {sections.map((sec, i) => {
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => onSectionChange?.(sec.id)}
              style={{
                background: "none",
                border: "none",
                borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                borderRight: i < sections.length - 1 ? "1px solid var(--rule-heavy)" : "none",
                padding: "0 16px",
                height: "100%",
                fontFamily: "'Geist Mono', monospace",
                fontSize: 10,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: isActive ? "var(--accent)" : "var(--ink-secondary)",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = "var(--ink)"; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = "var(--ink-secondary)"; }}
            >
              {sec.label}
            </button>
          );
        })}
      </div>

      {/* Row 4: Ticker */}
      <div style={{
        height: 24,
        background: "var(--paper-deep)",
        borderBottom: "1px solid var(--rule)",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
      }}>
        <div
          className="marquee-track font-mono"
          style={{ fontSize: 10, color: "var(--ink-secondary)", letterSpacing: "0.05em" }}
          dangerouslySetInnerHTML={{ __html: tickerStr }}
        />
      </div>
    </header>
  );
}
