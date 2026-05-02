"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";

/* ─── Types ───────────────────────────────────────────────────── */
export type CaseStudy = {
  quote: string;
  author: string;
  role: string;
  tags: { label: string; color: string; bg: string; border: string }[];
  type: "candidate" | "recruiter";
};

type Placement = {
  company: string;
  city: string;
  role: string;
  matchReason: string;
};

export interface SocialProofStepProps {
  formData: Record<string, any>;
  userId?: string;
  onBack: () => void;
}

/* ─── Data ────────────────────────────────────────────────────── */
export const CASE_STUDIES: CaseStudy[] = [
  {
    type: "candidate",
    quote:
      "I connected my GitHub on a Sunday. By Wednesday, the agent had submitted 12 verified applications. I got 4 interviews — all from companies that said they loved seeing actual proof.",
    author: "Priya M.",
    role: "Product Analyst → Ather Energy",
    tags: [
      { label: "Pulse Score: 84", color: "#2dd4bf", bg: "rgba(45,212,191,0.12)", border: "rgba(45,212,191,0.3)" },
      { label: "12 auto-applies",  color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.3)" },
    ],
  },
  {
    type: "recruiter",
    quote:
      "As a hiring manager, I was drowning in AI-generated resumes. Pulse-Ops candidates come with clickable proof for every claim. It cut our screening time in half.",
    author: "Rahul K.",
    role: "Engineering Lead, Greaves Electric",
    tags: [
      { label: "Recruiter",          color: "#fb923c", bg: "rgba(251,146,60,0.12)",  border: "rgba(251,146,60,0.3)"  },
      { label: "50% less screening", color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.3)"  },
    ],
  },
];

const PLACEMENTS: Placement[] = [
  {
    company: "Ola Electric",
    city: "Bangalore",
    role: "EV Data Analyst Intern",
    matchReason: "Matched via Supabase schema logs + GitHub data viz repos",
  },
  {
    company: "Razorpay",
    city: "Bangalore",
    role: "Backend Engineering Intern",
    matchReason: "Matched via 38 LeetCode Hards + API deployment history",
  },
  {
    company: "Flipkart",
    city: "Bangalore",
    role: "Product Analytics Intern",
    matchReason: "Matched via dashboard projects + SQL query complexity",
  },
];

/* ─── Style helpers ───────────────────────────────────────────── */
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono','Fira Code',monospace" };

const cardBase: React.CSSProperties = {
  background: "#111127",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "12px",
  padding: "20px",
  position: "relative",
  overflow: "hidden",
};

/* ─── Case study card ─────────────────────────────────────────── */
function CaseStudyCard({ cs }: { cs: CaseStudy }) {
  return (
    <div style={cardBase}>
      {/* Faint quote mark */}
      <div style={{
        position: "absolute", top: "10px", left: "16px",
        fontSize: "64px", lineHeight: 1, color: "#fff", opacity: 0.07,
        fontFamily: "Georgia, serif", userSelect: "none", pointerEvents: "none",
      }}>
        "
      </div>

      {/* Type badge */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
        <span style={{
          ...MONO, fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em",
          color: cs.type === "candidate" ? "#7C71E8" : "#fb923c",
          background: cs.type === "candidate" ? "rgba(83,74,183,0.12)" : "rgba(251,146,60,0.12)",
          border: `1px solid ${cs.type === "candidate" ? "rgba(83,74,183,0.25)" : "rgba(251,146,60,0.25)"}`,
          padding: "3px 8px", borderRadius: "5px",
        }}>
          {cs.type}
        </span>
      </div>

      {/* Quote */}
      <p style={{
        fontSize: "13px", color: "#a0a0b0", lineHeight: 1.75,
        fontStyle: "italic", marginBottom: "18px", position: "relative",
      }}>
        "{cs.quote}"
      </p>

      {/* Author */}
      <div style={{ marginBottom: "14px" }}>
        <div style={{ fontSize: "14px", fontWeight: 500, color: "#fff", marginBottom: "3px" }}>{cs.author}</div>
        <div style={{ fontSize: "12px", color: "#6b6b8a" }}>{cs.role}</div>
      </div>

      {/* Tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {cs.tags.map(tag => (
          <span key={tag.label} style={{
            ...MONO, fontSize: "11px", fontWeight: 500,
            color: tag.color, background: tag.bg, border: `1px solid ${tag.border}`,
            borderRadius: "5px", padding: "3px 9px",
          }}>
            {tag.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Placement card ──────────────────────────────────────────── */
function PlacementCard({ p }: { p: Placement }) {
  return (
    <div style={{ ...cardBase, padding: "16px" }}>
      {/* Placed badge */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
        <span style={{
          ...MONO, fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em",
          color: "#1D9E75", background: "rgba(29,158,117,0.12)",
          border: "1px solid rgba(29,158,117,0.3)",
          padding: "2px 8px", borderRadius: "4px",
        }}>
          ✓ Placed
        </span>
      </div>

      <div style={{ fontSize: "12px", color: "#6b6b8a", marginBottom: "5px", ...MONO }}>
        {p.company} · {p.city}
      </div>
      <div style={{ fontSize: "14px", fontWeight: 500, color: "#fff", marginBottom: "10px", lineHeight: 1.4 }}>
        {p.role}
      </div>
      <p style={{ fontSize: "12px", color: "#4a4a6a", lineHeight: 1.6, margin: 0 }}>
        {p.matchReason}
      </p>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────── */
export function SocialProofStep({ formData, userId, onBack }: SocialProofStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEnter = async () => {
    setLoading(true);
    setError("");

    try {
      const uid = userId ?? "demo";

      // POST profile (also upserts mission_parameters + internships)
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      await fetch(`${apiBase}/api/users/${uid}/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: formData.fullName,
          email: formData.email,
          current_role: formData.currentRole,
          target_domains: formData.targetDomains,
          target_roles: formData.targetRoles,
          min_salary: formData.minSalaryLPA ? parseInt(formData.minSalaryLPA) : null,
          location_preference: formData.locationPreference,
          internships: (formData.internships || []).map((i: any) => ({
            company: i.company,
            role: i.role,
            duration: i.duration,
            project_description: i.projectDescription,
            skills: i.skills,
          })),
        }),
      });

      // Mark onboarding complete
      await fetch(`${apiBase}/api/users/${uid}/onboarding-complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      // Backend unavailable — proceed anyway in demo mode
    }

    // Set cookie so middleware knows onboarding is done
    document.cookie = "pulse_onboarded=true; path=/; max-age=31536000; SameSite=Lax";
    window.location.href = "/dashboard";
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{
          display: "inline-block", ...MONO, fontSize: "10px", textTransform: "uppercase",
          letterSpacing: "0.14em", color: "#7C71E8", background: "rgba(83,74,183,0.12)",
          border: "1px solid rgba(83,74,183,0.25)", padding: "4px 10px", borderRadius: "6px",
          marginBottom: "14px",
        }}>
          Step 7 of 7 — Almost there
        </div>
        <h2 style={{ fontSize: "22px", fontWeight: 600, color: "#fff", marginBottom: "8px", letterSpacing: "-0.01em" }}>
          Proof it works
        </h2>
        <p style={{ fontSize: "14px", color: "#a0a0b0", lineHeight: 1.6 }}>
          See how others used Pulse-Ops to land roles — without sending a single resume manually.
        </p>
      </div>

      {/* Case studies */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "32px" }}>
        {CASE_STUDIES.map(cs => <CaseStudyCard key={cs.author} cs={cs} />)}
      </div>

      {/* Internship placements section */}
      <div style={{ marginBottom: "36px" }}>
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 500, color: "#fff", marginBottom: "6px" }}>
            Early career placements
          </h3>
          <p style={{ fontSize: "13px", color: "#6b6b8a" }}>
            Early career? Pulse-Ops works for internships too.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
          {PLACEMENTS.map(p => <PlacementCard key={p.role} p={p} />)}
        </div>
      </div>

      {/* Privacy note */}
      <div style={{
        background: "#0d0d1f", border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: "8px", padding: "12px 18px", marginBottom: "32px",
        display: "flex", alignItems: "flex-start", gap: "10px",
      }}>
        <span style={{ fontSize: "16px", flexShrink: 0, lineHeight: 1.2 }}>🔐</span>
        <p style={{ fontSize: "12px", color: "#4a4a6a", lineHeight: 1.7, margin: 0 }}>
          Your profile is <strong style={{ color: "#6b6b8a" }}>never shared with recruiters without your approval.</strong> When a recruiter shortlists you, you'll get a notification and can review the company before any contact is revealed.
        </p>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
        <button
          onClick={handleEnter}
          disabled={loading}
          style={{
            background: loading ? "#3a3558" : "#534AB7",
            color: "#fff", border: "none", borderRadius: "10px",
            padding: "14px 40px", fontSize: "16px", fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            maxWidth: "300px", width: "100%",
            boxShadow: loading ? "none" : "0 6px 30px rgba(83,74,183,0.45)",
            transition: "background 0.2s, box-shadow 0.2s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
            ...MONO,
          }}
          onMouseEnter={e => !loading && ((e.currentTarget as HTMLButtonElement).style.background = "#6358c7")}
          onMouseLeave={e => !loading && ((e.currentTarget as HTMLButtonElement).style.background = "#534AB7")}
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Activating…</>
            : "Enter the war room →"}
        </button>

        <button
          onClick={onBack}
          style={{
            background: "transparent", border: "none",
            color: "#4a4a6a", fontSize: "12px", cursor: "pointer",
            ...MONO,
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = "#a0a0b0")}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = "#4a4a6a")}
        >
          ← Go back
        </button>

        {error && (
          <p style={{ fontSize: "12px", color: "#f87171", ...MONO }}>{error}</p>
        )}
      </div>
    </div>
  );
}
