"use client";

import React from "react";

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" };

const FEATURE_CARDS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
        <line x1="12" y1="2" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22" />
        <line x1="2" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="22" y2="12" />
      </svg>
    ),
    iconColor: "#7C71E8",
    iconBg: "rgba(83,74,183,0.15)",
    iconBorder: "rgba(83,74,183,0.3)",
    title: "For candidates",
    description:
      "AI agents scout jobs, tailor applications with your verified work, and submit — autonomously. You set the targets, the agents execute.",
    badge: "Autonomous",
    badgeColor: "#534AB7",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
    iconColor: "#34d399",
    iconBg: "rgba(52,211,153,0.12)",
    iconBorder: "rgba(52,211,153,0.25)",
    title: "For recruiters",
    description:
      "See candidates ranked by cryptographically verified skills. Every claim links to real code, real commits, and real work — not self-reported.",
    badge: "Verified",
    badgeColor: "#059669",
  },
];

const METRICS = [
  { label: "Time saved weekly", value: "20+ hrs", sub: "per active job seeker" },
  { label: "Reduction in time-to-hire", value: "60–70%", sub: "for verified candidates" },
  { label: "Evidence standard", value: "Immutable", sub: "cryptographic proof" },
];

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div>
      {/* Headline */}
      <div className="mb-8">
        <div
          className="mb-4"
          style={{
            display: "inline-block",
            ...MONO,
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            color: "#7C71E8",
            background: "rgba(83,74,183,0.12)",
            border: "1px solid rgba(83,74,183,0.25)",
            padding: "4px 10px",
            borderRadius: "6px",
          }}
        >
          Pulse-Ops Platform — v2.0
        </div>

        <h1
          style={{
            fontSize: "28px",
            fontWeight: 600,
            color: "#ffffff",
            lineHeight: 1.3,
            letterSpacing: "-0.02em",
            marginBottom: "16px",
          }}
        >
          Stop optimizing resumes.{" "}
          <span style={{ color: "#7C71E8" }}>Start proving your work.</span>
        </h1>

        <p
          style={{
            fontSize: "14px",
            color: "#a0a0b0",
            maxWidth: "560px",
            lineHeight: 1.7,
          }}
        >
          Pulse-Ops replaces self-reported skills with verified evidence from your actual GitHub,
          LeetCode, and database activity. Our AI agents find, tailor, and submit applications —
          backed by cryptographic proof.
        </p>
      </div>

      {/* Feature cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
        {FEATURE_CARDS.map((card) => (
          <div
            key={card.title}
            style={{
              background: "#111127",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            {/* Icon */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: card.iconBg,
                  border: `1px solid ${card.iconBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: card.iconColor,
                }}
              >
                {card.icon}
              </div>
              <span
                style={{
                  ...MONO,
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#fff",
                  background: `${card.badgeColor}25`,
                  border: `1px solid ${card.badgeColor}50`,
                  padding: "3px 8px",
                  borderRadius: "5px",
                }}
              >
                {card.badge}
              </span>
            </div>

            <div style={{ fontSize: "15px", fontWeight: 500, color: "#ffffff", marginBottom: "8px" }}>
              {card.title}
            </div>
            <p style={{ fontSize: "13px", color: "#a0a0b0", lineHeight: 1.6 }}>
              {card.description}
            </p>
          </div>
        ))}
      </div>

      {/* Metric cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "36px" }}>
        {METRICS.map((m) => (
          <div
            key={m.label}
            style={{
              background: "#1a1a2e",
              borderRadius: "8px",
              padding: "16px",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div
              style={{
                ...MONO,
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#6b6b8a",
                marginBottom: "8px",
              }}
            >
              {m.label}
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 600,
                color: "#ffffff",
                lineHeight: 1.1,
                marginBottom: "4px",
              }}
            >
              {m.value}
            </div>
            <div style={{ ...MONO, fontSize: "10px", color: "#4a4a6a" }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: "12px", color: "#4a4a6a", ...MONO }}>
          // No credit card required · Free during beta
        </p>
        <button
          onClick={onNext}
          style={{
            background: "#534AB7",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            padding: "12px 28px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            minWidth: "160px",
            maxWidth: "200px",
            transition: "background 0.2s, box-shadow 0.2s",
            boxShadow: "0 4px 20px rgba(83,74,183,0.35)",
            ...MONO,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "#6358c7";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 28px rgba(83,74,183,0.5)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "#534AB7";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(83,74,183,0.35)";
          }}
        >
          Get started →
        </button>
      </div>
    </div>
  );
}
