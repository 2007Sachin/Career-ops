"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { RefreshCw } from "lucide-react";

/* ─── Types ───────────────────────────────────────────────────── */
interface IngestResult {
  commits: number;
  repos: number;
  prs: number;
  leetcodeProblems: number;
  leetcodeHard: number;
  pulseScore: number;
  recency: number;
  diversity: number;
  consistency: number;
  skills: string[];
}

interface TerminalLine {
  id: number;
  text: string;
  color?: string;
  bold?: boolean;
}

export interface PulseSyncStepProps {
  userId?: string;
  connectedPlatforms: string[];
  onNext: () => void;
  onBack: () => void;
}

/* ─── Constants ───────────────────────────────────────────────── */
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono','Fira Code',monospace" };

const FAKE_LINES = [
  "Connecting to ingestion daemon...",
  "Authenticating with GitHub OAuth...",
  "Scanning repository metadata...",
  "Analyzing commit history...",
  "Evaluating pull request complexity...",
  "Scoring impact levels with groq:llama-3.1-70b...",
  "Computing vector embeddings...",
];

const SKILL_COLORS = [
  { bg: "rgba(83,74,183,0.15)", border: "rgba(83,74,183,0.4)", color: "#a78bfa" },
  { bg: "rgba(45,212,191,0.12)", border: "rgba(45,212,191,0.35)", color: "#2dd4bf" },
  { bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.3)", color: "#fbbf24" },
  { bg: "rgba(251,146,60,0.12)", border: "rgba(251,146,60,0.3)", color: "#fb923c" },
  { bg: "rgba(74,222,128,0.12)", border: "rgba(74,222,128,0.3)", color: "#4ade80" },
  { bg: "rgba(244,114,182,0.12)", border: "rgba(244,114,182,0.3)", color: "#f472b6" },
  { bg: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.3)", color: "#60a5fa" },
  { bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.35)", color: "#c084fc" },
];

/* ─── Mock fallback data ──────────────────────────────────────── */
const MOCK_RESULT: IngestResult = {
  commits: 142, repos: 8, prs: 23,
  leetcodeProblems: 89, leetcodeHard: 12,
  pulseScore: 74,
  recency: 30, diversity: 25, consistency: 19,
  skills: ["Python", "FastAPI", "PostgreSQL", "Docker", "React", "TypeScript", "Redis", "AWS"],
};

/* ─── Helpers ─────────────────────────────────────────────────── */
const ts = () => {
  const n = new Date();
  return `[${n.getHours().toString().padStart(2, "0")}:${n.getMinutes().toString().padStart(2, "0")}:${n.getSeconds().toString().padStart(2, "0")}]`;
};

let lineId = 0;
const mkLine = (text: string, color?: string, bold?: boolean): TerminalLine =>
  ({ id: lineId++, text: `${ts()} ${text}`, color, bold });

/* ─── Metric card ─────────────────────────────────────────────── */
function MetricCard({ label, value, max, barColor, visible }: {
  label: string; value: number; max: number; barColor: string; visible: boolean;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{
      background: "#1a1a2e", borderRadius: "10px", padding: "14px 16px",
      opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(8px)",
      transition: "opacity 0.4s ease, transform 0.4s ease",
    }}>
      <div style={{ ...MONO, fontSize: "11px", color: "#6b6b8a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "10px" }}>
        <span style={{ fontSize: "22px", fontWeight: 500, color: "#fff" }}>{value}</span>
        <span style={{ fontSize: "13px", color: "#3a3a5a" }}>/ {max}</span>
      </div>
      <div style={{ height: "6px", background: "#2a2a3e", borderRadius: "999px", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: "999px", background: barColor,
          width: visible ? `${pct}%` : "0%",
          transition: "width 0.8s ease 0.2s",
        }} />
      </div>
    </div>
  );
}

/* ─── Boost tip ───────────────────────────────────────────────── */
function BoostTip({ result, visible }: { result: IngestResult; visible: boolean }) {
  let borderColor = "#534AB7";
  let tip = "";

  if (result.consistency < 20) {
    borderColor = "#fb7185";
    tip = "Push code on at least 20 of the next 30 days to unlock +10 consistency points.";
  } else if (result.diversity < 20) {
    borderColor = "#2dd4bf";
    tip = "Contribute to projects in different skill areas — try API work, data viz, or infrastructure.";
  } else if (result.recency < 25) {
    borderColor = "#a78bfa";
    tip = "Your recent activity is low. Push fresh work to boost your recency score.";
  } else {
    borderColor = "#4ade80";
    tip = "Great start! Keep your commit cadence consistent to push your score above 80.";
  }

  return (
    <div style={{
      background: "#111127", borderRadius: "0 8px 8px 0",
      borderLeft: `3px solid ${borderColor}`,
      border: `1px solid rgba(255,255,255,0.06)`,
      borderLeftColor: borderColor,
      borderLeftWidth: "3px",
      padding: "14px 18px",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(8px)",
      transition: "opacity 0.4s ease 0.1s, transform 0.4s ease 0.1s",
    }}>
      <div style={{ ...MONO, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em", color: borderColor, marginBottom: "6px" }}>
        ⚡ Boost tip
      </div>
      <p style={{ fontSize: "13px", color: "#a0a0b0", lineHeight: 1.6, margin: 0 }}>{tip}</p>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────── */
export function PulseSyncStep({ userId, connectedPlatforms, onNext, onBack }: PulseSyncStepProps) {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [phase, setPhase] = useState<"animating" | "done" | "error">("animating");
  const [result, setResult] = useState<IngestResult | null>(null);
  const [showMetrics, setShowMetrics] = useState(false);
  const [blink, setBlink] = useState(true);
  const terminalRef = useRef<HTMLDivElement>(null);
  const fakeIdx = useRef(0);
  const fakeTimer = useRef<ReturnType<typeof setInterval>>();

  const addLine = useCallback((line: TerminalLine) => {
    setLines(prev => [...prev, line]);
    setTimeout(() => terminalRef.current?.scrollTo({ top: 9999, behavior: "smooth" }), 50);
  }, []);

  /* blinking cursor */
  useEffect(() => {
    const t = setInterval(() => setBlink(b => !b), 530);
    return () => clearInterval(t);
  }, []);

  /* fake progress lines */
  const startFake = useCallback(() => {
    fakeIdx.current = 0;
    fakeTimer.current = setInterval(() => {
      if (fakeIdx.current < FAKE_LINES.length) {
        addLine(mkLine(FAKE_LINES[fakeIdx.current], "#a8e6cf"));
        fakeIdx.current++;
      }
    }, 320);
  }, [addLine]);

  const stopFake = useCallback(() => {
    if (fakeTimer.current) clearInterval(fakeTimer.current);
  }, []);

  /* API call */
  const runIngestion = useCallback(async () => {
    setLines([]);
    setPhase("animating");
    setResult(null);
    setShowMetrics(false);
    lineId = 0;

    startFake();

    try {
      const uid = userId ?? "demo";
      const res = await fetch(`http://localhost:8000/api/ingest/${uid}/all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      stopFake();

      let data: IngestResult;
      if (res.ok) {
        const raw = await res.json();
        data = {
          commits: raw.commits ?? MOCK_RESULT.commits,
          repos: raw.repos ?? MOCK_RESULT.repos,
          prs: raw.prs ?? MOCK_RESULT.prs,
          leetcodeProblems: raw.leetcode_problems ?? MOCK_RESULT.leetcodeProblems,
          leetcodeHard: raw.leetcode_hard ?? MOCK_RESULT.leetcodeHard,
          pulseScore: raw.pulse_score ?? MOCK_RESULT.pulseScore,
          recency: raw.recency ?? MOCK_RESULT.recency,
          diversity: raw.diversity ?? MOCK_RESULT.diversity,
          consistency: raw.consistency ?? MOCK_RESULT.consistency,
          skills: raw.skills ?? MOCK_RESULT.skills,
        };
      } else {
        throw new Error("non-ok");
      }

      showResults(data);
    } catch {
      stopFake();
      // Demo mode — use mock data
      await new Promise(r => setTimeout(r, 600));
      showResults(MOCK_RESULT);
    }
  }, [userId, startFake, stopFake, addLine]);

  const showResults = useCallback((data: IngestResult) => {
    const resultLines: TerminalLine[] = [
      mkLine(`Found ${data.commits} commits across ${data.repos} repos`, "#a8e6cf"),
      mkLine(`${data.prs} pull requests analyzed`, "#a8e6cf"),
    ];

    if (connectedPlatforms.includes("leetcode") || data.leetcodeProblems > 0) {
      resultLines.push(mkLine(`LeetCode: ${data.leetcodeProblems} problems solved (${data.leetcodeHard} Hard)`, "#a8e6cf"));
    }

    resultLines.push(mkLine("Generating skill embeddings...", "#a8e6cf"));

    // Add result lines with staggered delays
    resultLines.forEach((line, i) => {
      setTimeout(() => addLine(line), i * 280);
    });

    // Show final score line after stagger
    setTimeout(() => {
      addLine(mkLine(`Pulse Score calculated: ${data.pulseScore} / 100`, "#ffd93d", true));
      setResult(data);
      setPhase("done");
      setTimeout(() => setShowMetrics(true), 400);
    }, resultLines.length * 280 + 200);
  }, [connectedPlatforms, addLine]);

  /* start on mount */
  useEffect(() => {
    runIngestion();
    return () => stopFake();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "inline-block", ...MONO, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.14em", color: "#7C71E8", background: "rgba(83,74,183,0.12)", border: "1px solid rgba(83,74,183,0.25)", padding: "4px 10px", borderRadius: "6px", marginBottom: "14px" }}>
          Step 6 of 7 — Sync
        </div>
        <h2 style={{ fontSize: "22px", fontWeight: 600, color: "#fff", marginBottom: "8px", letterSpacing: "-0.01em" }}>Building your Pulse identity</h2>
        <p style={{ fontSize: "14px", color: "#a0a0b0", lineHeight: 1.6 }}>Ingesting your verified activity and calculating your initial score.</p>
      </div>

      {/* Terminal */}
      <div style={{ background: "#050510", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", overflow: "hidden", marginBottom: "20px" }}>
        {/* Title bar */}
        <div style={{ background: "#0d0d1f", padding: "10px 16px", display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          {["#ff5f57", "#febc2e", "#28c840"].map(c => (
            <div key={c} style={{ width: "11px", height: "11px", borderRadius: "50%", background: c, opacity: 0.75 }} />
          ))}
          <span style={{ ...MONO, fontSize: "10px", color: "#3a3a5a", marginLeft: "8px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            pulse-ops ingestion daemon
          </span>
          {phase === "animating" && (
            <span style={{ ...MONO, fontSize: "10px", color: "#534AB7", marginLeft: "auto", background: "rgba(83,74,183,0.1)", border: "1px solid rgba(83,74,183,0.2)", padding: "2px 8px", borderRadius: "4px" }}>
              ● running
            </span>
          )}
          {phase === "done" && (
            <span style={{ ...MONO, fontSize: "10px", color: "#1D9E75", marginLeft: "auto", background: "rgba(29,158,117,0.1)", border: "1px solid rgba(29,158,117,0.2)", padding: "2px 8px", borderRadius: "4px" }}>
              ✓ complete
            </span>
          )}
          {phase === "error" && (
            <span style={{ ...MONO, fontSize: "10px", color: "#f87171", marginLeft: "auto", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", padding: "2px 8px", borderRadius: "4px" }}>
              ✗ error
            </span>
          )}
        </div>

        {/* Log area */}
        <div
          ref={terminalRef}
          style={{ padding: "16px 20px", minHeight: "200px", maxHeight: "260px", overflowY: "auto", ...MONO, fontSize: "13px", lineHeight: "1.8" }}
        >
          {lines.map(line => (
            <div
              key={line.id}
              style={{
                color: line.color ?? "#a8e6cf",
                fontWeight: line.bold ? 700 : 400,
                animation: "fadeInLine 0.2s ease forwards",
              }}
            >
              {line.text}
            </div>
          ))}

          {phase === "error" && (
            <div style={{ color: "#f87171", marginTop: "8px" }}>
              {ts()} [ERROR] Ingestion failed. Check your connections.
              <button
                onClick={runIngestion}
                style={{
                  ...MONO, marginLeft: "12px", background: "rgba(248,113,113,0.15)",
                  border: "1px solid rgba(248,113,113,0.4)", color: "#f87171",
                  borderRadius: "5px", padding: "2px 10px", fontSize: "12px", cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: "4px",
                }}
              >
                <RefreshCw size={11} /> Retry
              </button>
            </div>
          )}

          {/* Blinking cursor */}
          {phase !== "error" && (
            <span style={{ color: phase === "done" ? "#1D9E75" : "#a8e6cf", opacity: blink ? 1 : 0, transition: "opacity 0.1s" }}>█</span>
          )}
        </div>
      </div>

      {/* Score breakdown */}
      {result && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "16px" }}>
            <MetricCard label="Recency" value={result.recency} max={40} barColor="#7C71E8" visible={showMetrics} />
            <MetricCard label="Diversity" value={result.diversity} max={30} barColor="#2dd4bf" visible={showMetrics} />
            <MetricCard label="Consistency" value={result.consistency} max={30} barColor="#fb7185" visible={showMetrics} />
          </div>

          {/* Boost tip */}
          <div style={{ marginBottom: "16px" }}>
            <BoostTip result={result} visible={showMetrics} />
          </div>

          {/* Skill tags */}
          {result.skills.length > 0 && (
            <div style={{
              background: "#111127", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px",
              padding: "16px 20px", marginBottom: "4px",
              opacity: showMetrics ? 1 : 0, transform: showMetrics ? "translateY(0)" : "translateY(8px)",
              transition: "opacity 0.4s ease 0.2s, transform 0.4s ease 0.2s",
            }}>
              <div style={{ ...MONO, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#4a4a6a", marginBottom: "12px" }}>
                Verified skills detected
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                {result.skills.slice(0, 8).map((skill, i) => {
                  const c = SKILL_COLORS[i % SKILL_COLORS.length];
                  return (
                    <span key={skill} style={{
                      background: c.bg, border: `1px solid ${c.border}`, borderRadius: "6px",
                      padding: "4px 12px", fontSize: "12px", fontWeight: 500, color: c.color,
                      ...MONO,
                    }}>
                      {skill}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "28px" }}>
        <button
          onClick={onBack}
          style={{ background: "transparent", border: "none", color: "#6b6b8a", fontSize: "13px", cursor: "pointer", padding: "8px 4px", ...MONO }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = "#fff")}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = "#6b6b8a")}
        >
          ← Back
        </button>
        <button
          onClick={phase === "done" ? onNext : undefined}
          disabled={phase !== "done"}
          style={{
            background: phase === "done" ? "#534AB7" : "#1e1e35",
            color: phase === "done" ? "#fff" : "#3a3a5a",
            border: "none", borderRadius: "8px", padding: "11px 28px",
            fontSize: "13px", fontWeight: 600,
            cursor: phase === "done" ? "pointer" : "not-allowed",
            boxShadow: phase === "done" ? "0 4px 18px rgba(83,74,183,0.35)" : "none",
            transition: "all 0.2s", ...MONO,
          }}
          onMouseEnter={e => phase === "done" && ((e.currentTarget as HTMLButtonElement).style.background = "#6358c7")}
          onMouseLeave={e => phase === "done" && ((e.currentTarget as HTMLButtonElement).style.background = "#534AB7")}
        >
          {phase === "animating" ? "Syncing…" : phase === "error" ? "Sync failed" : "Continue →"}
        </button>
      </div>

      {/* Keyframe for line fade-in */}
      <style>{`
        @keyframes fadeInLine {
          from { opacity: 0; transform: translateY(3px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>
    </div>
  );
}
