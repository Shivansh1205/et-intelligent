"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const PERSONAS = [
  { id: "investor", label: "Investor", desc: "Track markets, earnings, and IPOs" },
  { id: "founder", label: "Founder", desc: "Follow startups, funding, and strategy" },
  { id: "professional", label: "Professional", desc: "Industry trends and career moves" },
  { id: "student", label: "Student", desc: "Learn markets and business fundamentals" },
];

const SECTORS = [
  "fintech", "edtech", "healthtech", "ecommerce", "manufacturing",
  "banking", "real-estate", "startup-funding", "policy", "markets",
  "energy", "consumer", "media", "telecom",
];

const COMPANIES = [
  "Zomato", "Swiggy", "Paytm", "Zepto", "Reliance", "HDFC Bank",
  "Infosys", "TCS", "Wipro", "ICICI Bank", "Tata Motors", "Adani Group",
  "Ola Electric", "PhonePe", "CRED", "Razorpay", "Flipkart", "Dream11",
  "Meesho", "Nykaa", "Bharti Airtel", "L&T", "JSW Group", "Freshworks", "Lenskart",
];

const today = new Date().toLocaleDateString("en-IN", {
  weekday: "long", day: "numeric", month: "long", year: "numeric",
}).toUpperCase();

export default function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [persona, setPersona] = useState("");
  const [sectors, setSectors] = useState<string[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const toggleSector = (s: string) =>
    setSectors((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const toggleCompany = (c: string) =>
    setCompanies((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

  const handleFinish = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: user.id, persona, onboarding_done: true });

    if (profileError) { console.error("Profile upsert failed:", profileError); setSaving(false); return; }

    const interestInserts = [
      ...sectors.map((s) => ({ user_id: user.id, interest_type: "sector", interest_value: s, weight: 2.0 })),
      ...companies.map((c) => ({ user_id: user.id, interest_type: "company", interest_value: c, weight: 3.0 })),
    ];
    const graphInserts = [
      ...sectors.map((s) => ({ user_id: user.id, entity_type: "sector", entity_value: s, score: 1.5 })),
      ...companies.map((c) => ({ user_id: user.id, entity_type: "company", entity_value: c, score: 2.0 })),
    ];

    await Promise.all([
      interestInserts.length > 0
        ? supabase.from("user_interests").upsert(interestInserts, { onConflict: "user_id,interest_type,interest_value" })
        : Promise.resolve(),
      graphInserts.length > 0
        ? supabase.from("interest_graph").upsert(graphInserts, { onConflict: "user_id,entity_type,entity_value" })
        : Promise.resolve(),
    ]);

    router.push("/feed");
  };

  const stepLabels = ["Choose Persona", "Select Sectors", "Build Watchlist"];

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      {/* Mini masthead */}
      <div style={{ background: "var(--ink)", color: "var(--paper)", height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="font-mono" style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase" }}>{today}</span>
      </div>
      <div style={{ height: 64, borderBottom: "3px solid var(--ink)", borderTop: "1px solid var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "'UnifrakturMaguntia', cursive", fontSize: 40, color: "var(--ink)" }}>ET Intelligence</span>
      </div>

      {/* Section header */}
      <div style={{ padding: "24px 24px 0", maxWidth: 680, margin: "0 auto" }}>
        <div className="section-break">
          <span className="font-mono" style={{ fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink)", whiteSpace: "nowrap" }}>
            Personalise Your Edition
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
          <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
            Step {step + 1} of 3 — {stepLabels[step]}
          </span>
        </div>
      </div>

      {/* Form area */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px 48px" }}>

        {/* Step 0: Persona */}
        {step === 0 && (
          <>
            <h2 className="font-headline" style={{ fontSize: 28, fontWeight: 700, color: "var(--ink)", marginBottom: 8, textAlign: "center" }}>
              Who are you?
            </h2>
            <p className="font-body" style={{ fontSize: 14, fontStyle: "italic", color: "var(--ink-secondary)", textAlign: "center", marginBottom: 28, lineHeight: 1.6 }}>
              Choose your persona — this shapes how we prioritise and present news.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {PERSONAS.map((p) => (
                <div
                  key={p.id}
                  id={`persona-${p.id}`}
                  onClick={() => setPersona(p.id)}
                  style={{
                    padding: 20, cursor: "pointer",
                    border: persona === p.id ? "2px solid var(--accent)" : "1px solid var(--rule-heavy)",
                    background: persona === p.id ? "var(--paper-deep)" : "transparent",
                  }}
                >
                  <div className="font-headline" style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>{p.label}</div>
                  <div className="font-body" style={{ fontSize: 13, fontStyle: "italic", color: "var(--ink-secondary)", lineHeight: 1.5 }}>{p.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 28 }}>
              <button
                id="onboarding-next-1"
                disabled={!persona}
                onClick={() => setStep(1)}
                style={{
                  width: "100%", height: 44,
                  background: persona ? "var(--ink)" : "var(--rule)",
                  color: "var(--paper)", border: "none",
                  cursor: persona ? "pointer" : "not-allowed",
                  fontFamily: "'Geist Mono', monospace", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase",
                }}
                onMouseEnter={(e) => { if (persona) e.currentTarget.style.background = "var(--accent)"; }}
                onMouseLeave={(e) => { if (persona) e.currentTarget.style.background = "var(--ink)"; }}
              >
                Continue
              </button>
            </div>
          </>
        )}

        {/* Step 1: Sectors */}
        {step === 1 && (
          <>
            <h2 className="font-headline" style={{ fontSize: 28, fontWeight: 700, color: "var(--ink)", marginBottom: 8, textAlign: "center" }}>
              Pick your sectors
            </h2>
            <p className="font-body" style={{ fontSize: 14, fontStyle: "italic", color: "var(--ink-secondary)", textAlign: "center", marginBottom: 28, lineHeight: 1.6 }}>
              Select the industries you want to follow. Pick at least 3.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {SECTORS.map((s) => (
                <label key={s} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "6px 0" }}>
                  <input
                    type="checkbox"
                    id={`sector-${s}`}
                    checked={sectors.includes(s)}
                    onChange={() => toggleSector(s)}
                    style={{ accentColor: "var(--accent)", width: 14, height: 14, cursor: "pointer" }}
                  />
                  <span className="font-body" style={{ fontSize: 14, color: "var(--ink)" }}>{s}</span>
                </label>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
              <button onClick={() => setStep(0)} style={{
                height: 44, padding: "0 24px", background: "transparent",
                border: "1px solid var(--ink)", color: "var(--ink)", cursor: "pointer",
                fontFamily: "'Geist Mono', monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
              }}>
                Back
              </button>
              <button
                id="onboarding-next-2"
                disabled={sectors.length < 3}
                onClick={() => setStep(2)}
                style={{
                  flex: 1, height: 44,
                  background: sectors.length >= 3 ? "var(--ink)" : "var(--rule)",
                  color: "var(--paper)", border: "none",
                  cursor: sectors.length >= 3 ? "pointer" : "not-allowed",
                  fontFamily: "'Geist Mono', monospace", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase",
                }}
                onMouseEnter={(e) => { if (sectors.length >= 3) e.currentTarget.style.background = "var(--accent)"; }}
                onMouseLeave={(e) => { if (sectors.length >= 3) e.currentTarget.style.background = "var(--ink)"; }}
              >
                Continue
              </button>
            </div>
          </>
        )}

        {/* Step 2: Companies */}
        {step === 2 && (
          <>
            <h2 className="font-headline" style={{ fontSize: 28, fontWeight: 700, color: "var(--ink)", marginBottom: 8, textAlign: "center" }}>
              Build your watchlist
            </h2>
            <p className="font-body" style={{ fontSize: 14, fontStyle: "italic", color: "var(--ink-secondary)", textAlign: "center", marginBottom: 28, lineHeight: 1.6 }}>
              Choose companies you want to track closely.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {COMPANIES.map((c) => (
                <label key={c} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "6px 0" }}>
                  <input
                    type="checkbox"
                    id={`company-${c.replace(/\s+/g, "-").toLowerCase()}`}
                    checked={companies.includes(c)}
                    onChange={() => toggleCompany(c)}
                    style={{ accentColor: "var(--accent)", width: 14, height: 14, cursor: "pointer" }}
                  />
                  <span className="font-body" style={{ fontSize: 14, color: "var(--ink)" }}>{c}</span>
                </label>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
              <button onClick={() => setStep(1)} style={{
                height: 44, padding: "0 24px", background: "transparent",
                border: "1px solid var(--ink)", color: "var(--ink)", cursor: "pointer",
                fontFamily: "'Geist Mono', monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
              }}>
                Back
              </button>
              <button
                id="onboarding-finish"
                disabled={saving}
                onClick={handleFinish}
                style={{
                  flex: 1, height: 44,
                  background: saving ? "var(--rule)" : "var(--ink)",
                  color: "var(--paper)", border: "none",
                  cursor: saving ? "wait" : "pointer",
                  fontFamily: "'Geist Mono', monospace", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase",
                }}
                onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = "var(--accent)"; }}
                onMouseLeave={(e) => { if (!saving) e.currentTarget.style.background = "var(--ink)"; }}
              >
                {saving ? "Setting up..." : "Begin Reading"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
