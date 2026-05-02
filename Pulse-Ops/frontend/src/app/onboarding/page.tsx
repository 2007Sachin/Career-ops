"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ── Types ─────────────────────────────────────────────────────────
type Phase =
  | "boot" | "name" | "email" | "role" | "experience"
  | "domains" | "target_roles" | "salary"
  | "github" | "leetcode" | "syncing" | "done";

interface Msg {
  id: string;
  from: "agent" | "user";
  text: string;
}

interface Profile {
  name: string;
  email: string;
  currentRole: string;
  yearsExp: string;
  targetDomains: string[];
  targetRoles: string[];
  minSalaryLPA: number | null;
  github: string;
  leetcode: string;
  pulseScore: number | null;
}

// ── Static data ───────────────────────────────────────────────────
const DOMAINS = [
  "FinTech", "AI / ML", "SaaS", "Dev Tools",
  "Web3", "HealthTech", "EdTech", "Gaming",
  "E-commerce", "Infra / Cloud",
];

const ROLES = [
  "Software Engineer", "ML Engineer",
  "Backend Engineer", "Frontend Engineer",
  "Full Stack", "Data Engineer",
  "DevOps / SRE", "Product Engineer",
];

const EXP_OPTS = ["0 – 1 yr", "1 – 3 yrs", "3 – 5 yrs", "5+ yrs"];

const SALARY_OPTS = [
  { label: "< 5 LPA",   value: 5  },
  { label: "5–10 LPA",  value: 10 },
  { label: "10–20 LPA", value: 20 },
  { label: "20–35 LPA", value: 35 },
  { label: "35+ LPA",   value: 40 },
];

const SYNC_LOGS = [
  "Authenticating with connected platforms...",
  "Indexing repositories and commit history...",
  "Scoring impact of recent pull requests...",
  "Running skill inference model...",
  "Tagging entries with skill labels...",
  "Computing recency component.............. 34 / 40",
  "Computing diversity component............. 24 / 30",
  "Computing consistency component........... 19 / 30",
  "Generating 7-day activity sparkline...",
  "Building skill confidence matrix...",
  "Profile initialized. Agent armed and ready. ✓",
];

const PULSE_SCORE = 77;

// ── Profile row — module-level so React never sees a new component type ──
function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between items-baseline py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest shrink-0 mr-3">
        {label}
      </span>
      <span className={`text-xs text-right truncate max-w-[60%] ${value ? "text-slate-800" : "text-slate-300"}`}>
        {value ?? "—"}
      </span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();

  const [phase, setPhase]               = useState<Phase>("boot");
  const [messages, setMessages]         = useState<Msg[]>([]);
  const [typing, setTyping]             = useState(false);
  const [input, setInput]               = useState("");
  const [syncLogs, setSyncLogs]         = useState<string[]>([]);
  const [syncComplete, setSyncComplete] = useState(false);
  const [userId, setUserId]             = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile>({
    name: "", email: "", currentRole: "", yearsExp: "",
    targetDomains: [], targetRoles: [], minSalaryLPA: null,
    github: "", leetcode: "", pulseScore: null,
  });

  const chatEndRef  = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const profileRef  = useRef(profile);
  // Prevents the boot sequence from running twice in React Strict Mode
  const hasBooted   = useRef(false);

  // Keep ref in sync so the sync effect can read latest profile
  useEffect(() => { profileRef.current = profile; }, [profile]);

  // Auth — get current user (anonymous sessions allowed; userId stays null if not signed in)
  useEffect(() => {
    supabase.auth.getUser()
      .then(({ data, error }) => {
        if (data.user) setUserId(data.user.id);
        else if (error) console.warn("Auth.getUser failed:", error.message);
      })
      .catch((e) => console.warn("Auth.getUser threw:", e));
  }, []);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, syncLogs]);

  // Focus text input whenever a text-entry phase becomes active
  useEffect(() => {
    const textPhases: Phase[] = ["name", "email", "role", "github", "leetcode"];
    if (textPhases.includes(phase)) {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [phase]);

  // ── Speech helpers ────────────────────────────────────────────
  const say = useCallback((text: string, thinkMs = 700): Promise<void> =>
    new Promise((resolve) => {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setMessages((m) => [...m, { id: crypto.randomUUID(), from: "agent", text }]);
        resolve();
      }, thinkMs);
    }), []);

  const hear = useCallback((text: string) => {
    setMessages((m) => [...m, { id: crypto.randomUUID(), from: "user", text }]);
  }, []);

  // ── Boot sequence (runs once) ─────────────────────────────────
  useEffect(() => {
    if (hasBooted.current) return;
    hasBooted.current = true;
    (async () => {
      await say("◼  PULSE-OPS CAREER AGENT  v1.0  ──  INITIALIZING", 100);
      await say("All systems nominal. Secure session established. ✓", 900);
      await say(
        "I'm your autonomous career operations agent. I'll map your profile, verify your skills across platforms, and deploy intelligent job missions on your behalf.",
        1300,
      );
      await say("Let's start building your profile. What's your full name?", 800);
      setPhase("name");
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs once on mount

  // ── Sync sequence ─────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "syncing") return;
    (async () => {
      for (let i = 0; i < SYNC_LOGS.length; i++) {
        await new Promise<void>((r) => setTimeout(r, 480 + Math.random() * 520));
        setSyncLogs((prev) => [...prev, SYNC_LOGS[i]]);
      }

      setProfile((p) => ({ ...p, pulseScore: PULSE_SCORE }));
      setSyncComplete(true);

      // Persist to backend (best-effort — UI continues regardless)
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const p = profileRef.current;
      if (userId) {
        const ctrl = new AbortController();
        const timeoutId = setTimeout(() => ctrl.abort(), 10_000);
        fetch(`${apiBase}/api/users/${userId}/profile`, {
          method: "POST",
          signal: ctrl.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: p.name,
            email: p.email,
            current_role: p.currentRole,
            target_domains: p.targetDomains,
            target_roles: p.targetRoles.join(","),
            min_salary_lpa: p.minSalaryLPA,
          }),
        })
          .then((res) => {
            clearTimeout(timeoutId);
            if (!res.ok) throw new Error(`Profile save failed: ${res.status}`);
            return fetch(`${apiBase}/api/users/${userId}/onboarding-complete`, { method: "POST" });
          })
          .catch((e) => {
            clearTimeout(timeoutId);
            console.error("Onboarding persistence error:", e?.message ?? e);
            // Don't block UX — user can still proceed to dashboard
          });
      }

      await say(`Pulse Score: ${PULSE_SCORE}/100 — above average for your experience bracket.`, 1200);
      await say("Your career agent is armed. Launch your command center to begin.", 1000);
      setPhase("done");
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]); // say and userId are stable refs; profile read via profileRef

  // ── Submit handlers ───────────────────────────────────────────
  const submitName = useCallback(async () => {
    const v = input.trim();
    if (!v) return;
    hear(v);
    setInput("");
    setProfile((p) => ({ ...p, name: v }));
    await say(`${v.split(" ")[0]} — noted. What's your email address?`);
    setPhase("email");
  }, [input, hear, say]);

  const submitEmail = useCallback(async () => {
    const v = input.trim();
    if (!v || !v.includes("@")) return;
    hear(v);
    setInput("");
    setProfile((p) => ({ ...p, email: v }));
    await say("Got it. What's your current role, or what are you studying?");
    setPhase("role");
  }, [input, hear, say]);

  const submitRole = useCallback(async () => {
    const v = input.trim();
    if (!v) return;
    hear(v);
    setInput("");
    setProfile((p) => ({ ...p, currentRole: v }));
    await say("Understood. How many years of engineering experience do you have?");
    setPhase("experience");
  }, [input, hear, say]);

  const selectExp = useCallback(async (exp: string) => {
    hear(exp);
    setProfile((p) => ({ ...p, yearsExp: exp }));
    await say("Good. Now let's lock in your mission parameters. Which domains are you targeting?");
    setPhase("domains");
  }, [hear, say]);

  const toggleDomain = useCallback((d: string) => {
    setProfile((p) => ({
      ...p,
      targetDomains: p.targetDomains.includes(d)
        ? p.targetDomains.filter((x) => x !== d)
        : [...p.targetDomains, d],
    }));
  }, []);

  const confirmDomains = useCallback(async (domains: string[]) => {
    if (!domains.length) return;
    hear(domains.join("  ·  "));
    await say("Target domains locked. Which roles are you going after?");
    setPhase("target_roles");
  }, [hear, say]);

  const toggleRole = useCallback((r: string) => {
    setProfile((p) => ({
      ...p,
      targetRoles: p.targetRoles.includes(r)
        ? p.targetRoles.filter((x) => x !== r)
        : [...p.targetRoles, r],
    }));
  }, []);

  const confirmRoles = useCallback(async (roles: string[]) => {
    if (!roles.length) return;
    hear(roles.join("  ·  "));
    await say("Roles confirmed. What's your minimum expected CTC?");
    setPhase("salary");
  }, [hear, say]);

  const selectSalary = useCallback(async (label: string, value: number) => {
    hear(label);
    setProfile((p) => ({ ...p, minSalaryLPA: value }));
    await say(
      "Salary floor set. Now I need to link your proof-of-work platforms to verify your skills objectively.",
    );
    await say("What's your GitHub username?", 500);
    setPhase("github");
  }, [hear, say]);

  const submitGithub = useCallback(async () => {
    const v = input.trim();
    if (!v) return;
    hear(`@${v}`);
    setInput("");
    setProfile((p) => ({ ...p, github: v }));
    await say(`GitHub linked. Do you have a LeetCode profile? Enter your username, or type "skip".`);
    setPhase("leetcode");
  }, [input, hear, say]);

  const submitLeetcode = useCallback(async () => {
    const raw = input.trim().toLowerCase();
    const skip = raw === "" || raw === "skip";
    const username = skip ? "" : input.trim();
    hear(skip ? "Skipping" : username);
    setInput("");
    setProfile((p) => ({ ...p, leetcode: username }));
    await say("All parameters collected. Initializing your Pulse profile — stand by.");
    setPhase("syncing");
  }, [input, hear, say]);

  const launch = useCallback(() => {
    document.cookie = "pulse_onboarded=true; path=/; max-age=31536000";
    router.push("/dashboard");
  }, [router]);

  // ── Keyboard submit ───────────────────────────────────────────
  const onKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    if (phase === "name")          submitName();
    else if (phase === "email")    submitEmail();
    else if (phase === "role")     submitRole();
    else if (phase === "github")   submitGithub();
    else if (phase === "leetcode") submitLeetcode();
  }, [phase, submitName, submitEmail, submitRole, submitGithub, submitLeetcode]);

  // ── Input area ────────────────────────────────────────────────
  const renderInput = () => {
    if (typing) return null;

    const textPhases = ["name", "email", "role", "github", "leetcode"] as const;
    if ((textPhases as readonly string[]).includes(phase)) {
      const placeholders: Record<string, string> = {
        name:     "Your full name...",
        email:    "you@email.com",
        role:     "e.g. Backend Engineer, CS student...",
        github:   "github_username",
        leetcode: "leetcode_username or type skip",
      };
      const handlers: Record<string, () => void> = {
        name: submitName, email: submitEmail, role: submitRole,
        github: submitGithub, leetcode: submitLeetcode,
      };
      return (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder={placeholders[phase]}
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:border-[#1e3060]/50 focus:ring-1 focus:ring-[#1e3060]/20 transition-all shadow-sm"
          />
          <button
            onClick={handlers[phase]}
            className="px-5 py-3 rounded-xl bg-[#1e3060] hover:bg-[#162448] text-white text-sm font-semibold transition-all shrink-0 shadow-sm"
          >
            Send ↵
          </button>
        </div>
      );
    }

    if (phase === "experience") {
      return (
        <div className="flex flex-wrap gap-2">
          {EXP_OPTS.map((e) => (
            <button
              key={e}
              onClick={() => selectExp(e)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-[#1e3060]/40 hover:text-[#1e3060] hover:bg-[#1e3060]/5 transition-all text-sm font-medium shadow-sm"
            >
              {e}
            </button>
          ))}
        </div>
      );
    }

    if (phase === "domains") {
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {DOMAINS.map((d) => (
              <button
                key={d}
                onClick={() => toggleDomain(d)}
                className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                  profile.targetDomains.includes(d)
                    ? "border-[#1e3060] bg-[#1e3060]/10 text-[#1e3060]"
                    : "border-slate-200 bg-white text-slate-600 hover:border-[#1e3060]/40 hover:text-[#1e3060] hover:bg-[#1e3060]/5"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <button
            onClick={() => confirmDomains(profile.targetDomains)}
            disabled={profile.targetDomains.length === 0}
            className="px-5 py-2.5 rounded-xl bg-[#1e3060] hover:bg-[#162448] disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-sm"
          >
            Confirm{profile.targetDomains.length > 0 ? ` (${profile.targetDomains.length} selected)` : ""}
          </button>
        </div>
      );
    }

    if (phase === "target_roles") {
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => toggleRole(r)}
                className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                  profile.targetRoles.includes(r)
                    ? "border-[#1e3060] bg-[#1e3060]/10 text-[#1e3060]"
                    : "border-slate-200 bg-white text-slate-600 hover:border-[#1e3060]/40 hover:text-[#1e3060] hover:bg-[#1e3060]/5"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <button
            onClick={() => confirmRoles(profile.targetRoles)}
            disabled={profile.targetRoles.length === 0}
            className="px-5 py-2.5 rounded-xl bg-[#1e3060] hover:bg-[#162448] disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-sm"
          >
            Confirm{profile.targetRoles.length > 0 ? ` (${profile.targetRoles.length} selected)` : ""}
          </button>
        </div>
      );
    }

    if (phase === "salary") {
      return (
        <div className="flex flex-wrap gap-2">
          {SALARY_OPTS.map(({ label, value }) => (
            <button
              key={label}
              onClick={() => selectSalary(label, value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-[#1e3060]/40 hover:text-[#1e3060] hover:bg-[#1e3060]/5 transition-all text-sm font-medium shadow-sm"
            >
              {label}
            </button>
          ))}
        </div>
      );
    }

    if (phase === "done") {
      return (
        <button
          onClick={launch}
          className="w-full py-4 rounded-xl bg-[#1e3060] hover:bg-[#162448] text-white font-semibold text-base tracking-wide transition-all shadow-md hover:shadow-lg"
        >
          Open Your Dashboard →
        </button>
      );
    }

    return null;
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-[#f0f2f8] overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── LEFT: Agent Chat ───────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 border-r border-slate-200 bg-white">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 shrink-0 bg-white">
          <div className="flex items-center gap-2 mr-4">
            <div className="w-7 h-7 rounded-md bg-[#1e3060] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            </div>
            <span className="font-bold text-[#1e3060] text-base tracking-tight">Pulse-Ops</span>
          </div>

          <div className="flex gap-1.5 items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-500 text-[11px] font-medium uppercase tracking-widest">
              Career Agent
            </span>
          </div>

          <span className="ml-auto text-slate-300 text-[11px] font-mono hidden sm:block">
            ONBOARDING_SESSION_001
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-3 bg-[#f8f9fb]">
          {/* Shown only before JS boots */}
          {messages.length === 0 && !typing && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-7 h-7 rounded-lg bg-[#1e3060]/10 border border-[#1e3060]/20 flex items-center justify-center shrink-0">
                <span className="text-[#1e3060] text-[9px] font-bold">AI</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 shadow-sm">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-1.5 h-1.5 rounded-full bg-[#1e3060]/40 animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.from === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.from === "agent" && (
                <div className="w-7 h-7 rounded-lg bg-[#1e3060]/10 border border-[#1e3060]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[#1e3060] text-[9px] font-bold tracking-tight">AI</span>
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.from === "agent"
                    ? "bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm"
                    : "bg-[#1e3060] text-white rounded-tr-sm shadow-sm"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {typing && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-7 h-7 rounded-lg bg-[#1e3060]/10 border border-[#1e3060]/20 flex items-center justify-center shrink-0">
                <span className="text-[#1e3060] text-[9px] font-bold">AI</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 shadow-sm">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-1.5 h-1.5 rounded-full bg-[#1e3060]/40 animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sync terminal block — keep dark for terminal feel */}
          {syncLogs.length > 0 && (
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 font-mono text-xs space-y-2">
              <div className="flex items-center gap-2 pb-2.5 mb-0.5 border-b border-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-400 text-[10px] uppercase tracking-widest">
                  Pulse Initialization
                </span>
              </div>
              {syncLogs.map((log, i) => {
                const isActive = i === syncLogs.length - 1 && !syncComplete;
                return (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className={isActive ? "text-yellow-400" : "text-emerald-500"}>
                      {isActive ? "▶" : "✓"}
                    </span>
                    <span className={isActive ? "text-slate-200" : "text-slate-500"}>
                      {log}
                    </span>
                  </div>
                );
              })}
              {!syncComplete && (
                <span className="inline-block ml-5 text-emerald-400 animate-pulse">█</span>
              )}
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="px-5 pb-6 pt-3 border-t border-slate-200 bg-white shrink-0 min-h-[80px] flex items-start">
          <div className="w-full">{renderInput()}</div>
        </div>
      </div>

      {/* ── RIGHT: Profile Preview ─────────────────────────────── */}
      <div className="hidden lg:flex flex-col w-72 xl:w-80 bg-[#f0f2f8] p-5 overflow-y-auto shrink-0 gap-3 border-l border-slate-200">

        {/* Section header */}
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#1e3060]" />
          <span className="text-[#1e3060] text-[10px] font-semibold uppercase tracking-widest">Your Profile</span>
        </div>

        {/* Avatar card */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#1e3060] flex items-center justify-center text-white font-bold text-lg shrink-0">
            {profile.name ? profile.name[0].toUpperCase() : "?"}
          </div>
          <div className="min-w-0">
            <div className="text-slate-900 text-sm font-semibold truncate">
              {profile.name || <span className="text-slate-300">—</span>}
            </div>
            <div className="text-slate-500 text-[11px] truncate">
              {profile.email || <span className="text-slate-300">—</span>}
            </div>
          </div>
        </div>

        {/* Basic stats */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-0.5">
          <Row label="Role"     value={profile.currentRole || null} />
          <Row label="Exp"      value={profile.yearsExp || null} />
          <Row label="Min CTC"  value={profile.minSalaryLPA ? `${profile.minSalaryLPA} LPA` : null} />
          <Row label="GitHub"   value={profile.github ? `@${profile.github}` : null} />
          <Row label="LeetCode" value={profile.leetcode || null} />
        </div>

        {/* Target Domains */}
        {profile.targetDomains.length > 0 && (
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="text-slate-400 text-[9px] font-semibold uppercase tracking-widest mb-2.5">
              Target Domains
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.targetDomains.map((d) => (
                <span key={d} className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[10px] border border-blue-200 font-medium">
                  {d}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Target Roles */}
        {profile.targetRoles.length > 0 && (
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="text-slate-400 text-[9px] font-semibold uppercase tracking-widest mb-2.5">
              Target Roles
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.targetRoles.map((r) => (
                <span key={r} className="px-2 py-0.5 rounded-lg bg-[#1e3060]/10 text-[#1e3060] text-[10px] border border-[#1e3060]/20 font-medium">
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Pulse Score */}
        {profile.pulseScore !== null ? (
          <div className="p-4 rounded-xl bg-[#1e3060] border border-[#1e3060] mt-auto shadow-md">
            <div className="text-white/60 text-[9px] font-semibold uppercase tracking-widest mb-3">
              Pulse Score
            </div>
            <div className="text-5xl font-bold text-white leading-none mb-1">
              {profile.pulseScore}
            </div>
            <div className="text-white/40 text-[10px] mb-4">/ 100</div>
            <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-white transition-all duration-1000 ease-out"
                style={{ width: `${profile.pulseScore}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-[9px] text-white/40">
              <span>Recency · 34</span>
              <span>Diversity · 24</span>
              <span>Consistency · 19</span>
            </div>
          </div>
        ) : (
          !profile.name && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10 mt-auto">
              <div className="w-10 h-10 rounded-xl bg-[#1e3060]/10 border border-[#1e3060]/20 flex items-center justify-center mb-4">
                <span className="text-[#1e3060] text-lg">◼</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Your profile builds<br />here as you talk<br />to the agent.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
