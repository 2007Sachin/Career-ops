"use client";
import { useState } from "react";
import { NavButtons, CARD_STYLE, LABEL_STYLE, INPUT_STYLE } from "./_components";
import { CheckCircle2, GitFork, Code, Database, Globe, Loader2 } from "lucide-react";

const MONO = { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" };

// Step 3: Connect Platforms
const PLATFORMS = [
  { id: "github", icon: GitFork, label: "GitHub", desc: "Commits, PRs, repos", color: "#f0f6ff", needsInput: false },
  { id: "leetcode", icon: Code, label: "LeetCode", desc: "Solved problems & rank", color: "#ffd700", needsInput: true, placeholder: "LeetCode username" },
  { id: "supabase", icon: Database, label: "Supabase", desc: "Schema DDL & migrations", color: "#3ECF8E", needsInput: true, placeholder: "Project ref ID" },
  { id: "portfolio", icon: Globe, label: "Portfolio / Blog", desc: "Personal site or blog URL", color: "#818cf8", needsInput: true, placeholder: "https://yoursite.dev" },
];

export function StepConnect({ data, onChange, onNext, onBack }: {
  data: any; onChange: (k: string, v: any) => void; onNext: () => void; onBack: () => void;
}) {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const connected: string[] = data.connectedPlatforms || [];

  const connect = (id: string) => {
    onChange("connectedPlatforms", [...connected, id]);
  };

  return (
    <div>
      <div className="mb-6">
        <div style={LABEL_STYLE} className="mb-1">Step 4 of 6</div>
        <h2 className="text-2xl font-bold text-white">Connect your data sources</h2>
        <p className="text-slate-500 text-sm mt-1">The more you connect, the higher your Pulse Score ceiling. GitHub is recommended.</p>
      </div>
      <div className="space-y-3">
        {PLATFORMS.map(({ id, icon: Icon, label, desc, color, needsInput, placeholder }) => {
          const isConnected = connected.includes(id);
          return (
            <div key={id} className={`${CARD_STYLE} flex items-center gap-4`}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-white font-semibold text-sm">{label}</span>
                  {isConnected && <CheckCircle2 className="w-3.5 h-3.5 text-[#7C71E8]" />}
                </div>
                <p className="text-slate-500 text-xs">{desc}</p>
                {needsInput && !isConnected && (
                  <input
                    className={`${INPUT_STYLE} mt-2 text-xs py-1.5`}
                    placeholder={placeholder}
                    value={inputs[id] || ""}
                    onChange={e => setInputs(prev => ({ ...prev, [id]: e.target.value }))}
                  />
                )}
              </div>
              <button
                onClick={() => connect(id)}
                disabled={isConnected || (needsInput && !inputs[id])}
                className={`shrink-0 px-4 py-2 rounded-lg text-xs font-semibold transition-all border ${
                  isConnected
                    ? "bg-[#534AB7]/20 border-[#534AB7]/50 text-[#7C71E8] cursor-default"
                    : "bg-[#534AB7] border-[#534AB7] text-white hover:bg-[#6259d1] disabled:opacity-30 disabled:cursor-not-allowed"
                }`}
                style={MONO}
              >
                {isConnected ? "Connected" : id === "github" ? "OAuth →" : "Connect"}
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-slate-600 text-xs mt-4 text-center" style={MONO}>
        // At least one source required to continue
      </p>
      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={connected.length === 0} />
    </div>
  );
}

// Step 4: Sync
const SYNC_LOGS = [
  "Initializing Pulse-Ops ingestion daemon...",
  "Connecting to GitHub OAuth endpoint...",
  "Fetching repository metadata (142 commits found)...",
  "Running impact scorer via groq:llama-3.1-70b...",
  "Calculating vector embeddings for skill graph...",
  "Aggregating consistency & recency signals...",
  "Pulse Score computed successfully.",
];

export function StepSync({ onNext, onBack }: {
  onNext: () => void; onBack: () => void;
}) {
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [running, setRunning] = useState(false);
  const [score] = useState({ total: 74, recency: 30, diversity: 25, consistency: 19 });

  const runSync = () => {
    if (running) return;
    setRunning(true);
    setLogs([]);
    setProgress(0);
    setDone(false);
    SYNC_LOGS.forEach((msg, i) => {
      setTimeout(() => {
        const t = new Date();
        const ts = `${t.getHours().toString().padStart(2,"0")}:${t.getMinutes().toString().padStart(2,"0")}:${t.getSeconds().toString().padStart(2,"0")}`;
        setLogs(p => [...p, `[${ts}] ${msg}`]);
        setProgress(Math.round(((i + 1) / SYNC_LOGS.length) * 100));
        if (i === SYNC_LOGS.length - 1) { setDone(true); setRunning(false); }
      }, i * 1100);
    });
  };

  return (
    <div>
      <div className="mb-6">
        <div style={LABEL_STYLE} className="mb-1">Step 5 of 6</div>
        <h2 className="text-2xl font-bold text-white">Initial data sync</h2>
        <p className="text-slate-500 text-sm mt-1">We'll ingest your connected sources and compute your baseline Pulse Score.</p>
      </div>

      {logs.length === 0 ? (
        <div className={`${CARD_STYLE} text-center py-12`}>
          <Loader2 className="w-8 h-8 text-[#7C71E8] mx-auto mb-4 opacity-60" />
          <p className="text-slate-400 text-sm mb-6">Ready to analyse your technical footprint.</p>
          <button onClick={runSync} className="bg-[#534AB7] hover:bg-[#6259d1] text-white px-8 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-lg shadow-[#534AB7]/20" style={MONO}>
            Run Pulse Sync →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-[#050510] border border-white/[0.06] rounded-xl p-4 font-mono text-xs h-52 overflow-y-auto">
            <div className="flex items-center gap-1.5 mb-3 pb-3 border-b border-white/[0.06]">
              {["#ff5f57","#febc2e","#28c840"].map(c => <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c, opacity: 0.7 }} />)}
              <span className="text-slate-600 ml-2 uppercase tracking-widest text-[9px]">pulse-ops ingestion daemon</span>
            </div>
            <div className="space-y-1.5">
              {logs.map((l, i) => <div key={i} className="text-[#7C71E8] opacity-90">{l}</div>)}
              {!done && <span className="text-[#7C71E8] animate-pulse">▌</span>}
            </div>
          </div>

          <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
            <div className="h-full bg-[#534AB7] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>

          {done && (
            <div className={`${CARD_STYLE} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
              <div className="flex items-end gap-1 mb-4">
                <span className="text-5xl font-black text-[#7C71E8]" style={MONO}>{score.total}</span>
                <span className="text-slate-500 text-xl mb-1" style={MONO}>/100</span>
                <span className="ml-3 mb-1 text-xs text-[#7C71E8] bg-[#534AB7]/20 border border-[#534AB7]/30 px-2 py-1 rounded-md font-semibold" style={MONO}>PULSE SCORE</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[{ l: "Recency", v: score.recency, max: 40 }, { l: "Diversity", v: score.diversity, max: 30 }, { l: "Consistency", v: score.consistency, max: 30, warn: true }].map(({ l, v, max, warn }) => (
                  <div key={l} className="bg-[#0a0a1a] rounded-lg p-3">
                    <div style={{ ...LABEL_STYLE, color: warn ? "#f87171" : undefined }} className="mb-1">{l}</div>
                    <div className="text-white font-bold text-lg" style={MONO}>{v}<span className="text-slate-600 text-xs font-normal">/{max}</span></div>
                    <div className="h-1 bg-white/[0.05] rounded-full mt-2 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(v / max) * 100}%`, backgroundColor: warn ? "#f87171" : "#534AB7" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!done} nextLabel="Finalise Setup →" />
    </div>
  );
}
