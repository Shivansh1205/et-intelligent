"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const PERSONAS = [
  {
    id: "investor",
    label: "Investor",
    icon: "📈",
    desc: "Track markets, earnings, and IPOs",
  },
  {
    id: "founder",
    label: "Founder",
    icon: "🚀",
    desc: "Follow startups, funding, and strategy",
  },
  {
    id: "professional",
    label: "Professional",
    icon: "💼",
    desc: "Industry trends and career moves",
  },
  {
    id: "student",
    label: "Student",
    icon: "🎓",
    desc: "Learn markets and business fundamentals",
  },
];

const SECTORS = [
  "fintech",
  "edtech",
  "healthtech",
  "ecommerce",
  "manufacturing",
  "banking",
  "real-estate",
  "startup-funding",
  "policy",
  "markets",
  "energy",
  "consumer",
  "media",
  "telecom",
];

const COMPANIES = [
  "Zomato",
  "Swiggy",
  "Paytm",
  "Zepto",
  "Reliance",
  "HDFC Bank",
  "Infosys",
  "TCS",
  "Wipro",
  "ICICI Bank",
  "Tata Motors",
  "Adani Group",
  "Ola Electric",
  "PhonePe",
  "CRED",
  "Razorpay",
  "Flipkart",
  "Dream11",
  "Meesho",
  "Nykaa",
  "Bharti Airtel",
  "L&T",
  "JSW Group",
  "Freshworks",
  "Lenskart",
];

export default function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [persona, setPersona] = useState("");
  const [sectors, setSectors] = useState<string[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const toggleSector = (s: string) =>
    setSectors((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  const toggleCompany = (c: string) =>
    setCompanies((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );

  const handleFinish = async () => {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    // Upsert profile (handles race condition where trigger hasn't fired yet)
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: user.id, persona, onboarding_done: true })
      .eq("id", user.id);

    if (profileError) {
      console.error("Profile upsert failed:", profileError);
      setSaving(false);
      return;
    }

    const interestInserts = [
      ...sectors.map((s) => ({
        user_id: user.id,
        interest_type: "sector",
        interest_value: s,
        weight: 2.0,
      })),
      ...companies.map((c) => ({
        user_id: user.id,
        interest_type: "company",
        interest_value: c,
        weight: 3.0,
      })),
    ];

    const graphInserts = [
      ...sectors.map((s) => ({
        user_id: user.id,
        entity_type: "sector",
        entity_value: s,
        score: 1.5,
      })),
      ...companies.map((c) => ({
        user_id: user.id,
        entity_type: "company",
        entity_value: c,
        score: 2.0,
      })),
    ];

    await Promise.all([
      interestInserts.length > 0
        ? supabase.from("user_interests").upsert(interestInserts, {
            onConflict: "user_id,interest_type,interest_value",
          })
        : Promise.resolve(),
      graphInserts.length > 0
        ? supabase.from("interest_graph").upsert(graphInserts, {
            onConflict: "user_id,entity_type,entity_value",
          })
        : Promise.resolve(),
    ]);

    router.push("/feed");
  };

  const styles = {
    container: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background:
        "radial-gradient(ellipse 120% 80% at 50% 20%, #1a1040 0%, var(--bg-primary) 50%)",
      padding: 24,
    } as React.CSSProperties,
    card: {
      background: "var(--bg-secondary)",
      border: "1px solid var(--border)",
      borderRadius: 20,
      padding: 40,
      maxWidth: 640,
      width: "100%",
    } as React.CSSProperties,
    stepIndicator: {
      display: "flex",
      gap: 8,
      marginBottom: 32,
      justifyContent: "center",
    } as React.CSSProperties,
    stepDot: (active: boolean) =>
      ({
        width: active ? 32 : 8,
        height: 8,
        borderRadius: 4,
        background: active ? "var(--accent-primary)" : "var(--border)",
        transition: "all 0.3s ease",
      }) as React.CSSProperties,
    title: {
      fontSize: 28,
      fontWeight: 700,
      color: "var(--text-primary)",
      marginBottom: 8,
      textAlign: "center" as const,
    } as React.CSSProperties,
    subtitle: {
      fontSize: 15,
      color: "var(--text-secondary)",
      textAlign: "center" as const,
      marginBottom: 28,
    } as React.CSSProperties,
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: 12,
    } as React.CSSProperties,
    chipGrid: {
      display: "flex",
      flexWrap: "wrap" as const,
      gap: 10,
      justifyContent: "center",
    } as React.CSSProperties,
    personaCard: (selected: boolean) =>
      ({
        padding: 20,
        borderRadius: 14,
        border: `1.5px solid ${selected ? "var(--accent-primary)" : "var(--border)"}`,
        background: selected ? "rgba(59,130,246,0.08)" : "var(--bg-tertiary)",
        cursor: "pointer",
        transition: "all 0.2s ease",
        textAlign: "center" as const,
      }) as React.CSSProperties,
    chip: (selected: boolean) =>
      ({
        padding: "8px 18px",
        borderRadius: 999,
        border: `1.5px solid ${selected ? "var(--accent-primary)" : "var(--border)"}`,
        background: selected ? "rgba(59,130,246,0.1)" : "transparent",
        color: selected ? "var(--accent-primary)" : "var(--text-secondary)",
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.2s ease",
      }) as React.CSSProperties,
    buttonRow: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: 32,
      gap: 12,
    } as React.CSSProperties,
    btnPrimary: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      border: "none",
      background:
        "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
      color: "#fff",
      fontSize: 15,
      fontWeight: 600,
      cursor: "pointer",
      transition: "transform 0.15s ease",
    } as React.CSSProperties,
    btnSecondary: {
      height: 48,
      padding: "0 24px",
      borderRadius: 12,
      border: "1px solid var(--border)",
      background: "transparent",
      color: "var(--text-secondary)",
      fontSize: 14,
      cursor: "pointer",
    } as React.CSSProperties,
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Step indicator */}
        <div style={styles.stepIndicator}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={styles.stepDot(step === i)} />
          ))}
        </div>

        {/* Step 0: Persona */}
        {step === 0 && (
          <>
            <h2 className="font-headline" style={styles.title}>
              Who are you?
            </h2>
            <p style={styles.subtitle}>
              Choose your persona — this shapes how we prioritize and present
              news.
            </p>
            <div style={styles.grid}>
              {PERSONAS.map((p) => (
                <div
                  key={p.id}
                  id={`persona-${p.id}`}
                  style={styles.personaCard(persona === p.id)}
                  onClick={() => setPersona(p.id)}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{p.icon}</div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    {p.label}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-tertiary)",
                      marginTop: 4,
                    }}
                  >
                    {p.desc}
                  </div>
                </div>
              ))}
            </div>
            <div style={styles.buttonRow}>
              <button
                id="onboarding-next-1"
                style={{
                  ...styles.btnPrimary,
                  opacity: persona ? 1 : 0.5,
                  cursor: persona ? "pointer" : "not-allowed",
                }}
                disabled={!persona}
                onClick={() => setStep(1)}
              >
                Continue →
              </button>
            </div>
          </>
        )}

        {/* Step 1: Sectors */}
        {step === 1 && (
          <>
            <h2 className="font-headline" style={styles.title}>
              Pick your sectors
            </h2>
            <p style={styles.subtitle}>
              Select the industries you want to follow. Pick at least 3.
            </p>
            <div style={styles.chipGrid}>
              {SECTORS.map((s) => (
                <div
                  key={s}
                  id={`sector-${s}`}
                  style={styles.chip(sectors.includes(s))}
                  onClick={() => toggleSector(s)}
                >
                  {s}
                </div>
              ))}
            </div>
            <div style={styles.buttonRow}>
              <button style={styles.btnSecondary} onClick={() => setStep(0)}>
                ← Back
              </button>
              <button
                id="onboarding-next-2"
                style={{
                  ...styles.btnPrimary,
                  opacity: sectors.length >= 3 ? 1 : 0.5,
                  cursor: sectors.length >= 3 ? "pointer" : "not-allowed",
                }}
                disabled={sectors.length < 3}
                onClick={() => setStep(2)}
              >
                Continue →
              </button>
            </div>
          </>
        )}

        {/* Step 2: Companies */}
        {step === 2 && (
          <>
            <h2 className="font-headline" style={styles.title}>
              Build your watchlist
            </h2>
            <p style={styles.subtitle}>
              Choose companies you want to track closely.
            </p>
            <div style={styles.chipGrid}>
              {COMPANIES.map((c) => (
                <div
                  key={c}
                  id={`company-${c.replace(/\s+/g, "-").toLowerCase()}`}
                  style={styles.chip(companies.includes(c))}
                  onClick={() => toggleCompany(c)}
                >
                  {c}
                </div>
              ))}
            </div>
            <div style={styles.buttonRow}>
              <button style={styles.btnSecondary} onClick={() => setStep(1)}>
                ← Back
              </button>
              <button
                id="onboarding-finish"
                style={{
                  ...styles.btnPrimary,
                  opacity: saving ? 0.6 : 1,
                }}
                disabled={saving}
                onClick={handleFinish}
              >
                {saving ? "Setting up..." : "Launch my feed 🚀"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
