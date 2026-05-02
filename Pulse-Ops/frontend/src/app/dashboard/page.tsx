"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useMissionsList, useCreateMission, usePulseScore, qk } from "@/lib/queries";
import { useQueryClient } from "@tanstack/react-query";
import type { MissionSummary } from "@/lib/api";
import {
  Search, MapPin, Clock, Briefcase, Bookmark, BookmarkCheck,
  Zap, Filter, Bell, Settings, Loader2,
  DollarSign, CheckCircle2, AlertCircle,
  TrendingUp, Star, BarChart2, SlidersHorizontal, X, ExternalLink,
  Cpu, Radio, Send, Building2, ChevronRight, LogOut, User,
} from "lucide-react";

// ── Mock data ─────────────────────────────────────────────────────
const MOCK_USER = {
  name: "Arjun Mehta",
  initials: "AM",
  title: "Backend Engineer",
  location: "Bangalore, India",
  pulseScore: 84,
  sparkline: [62, 65, 71, 70, 78, 80, 84],
  profileComplete: 82,
  targetRoles: ["Backend Engineer", "Platform Engineer"],
  targetDomains: ["FinTech", "AI / ML", "SaaS"],
};

const MOCK_JOBS = [
  {
    id: "j1",
    title: "Senior Backend Engineer",
    company: "Razorpay",
    companyInitial: "R",
    companyColor: "#2563eb",
    location: "Bangalore",
    workMode: "Hybrid",
    salary: "₹28 – 40 LPA",
    experience: "3 – 6 yrs",
    posted: "2 days ago",
    domain: "FinTech",
    type: "Full-time",
    match: 94,
    tags: ["Python", "FastAPI", "PostgreSQL", "Kafka"],
    description: "Build and scale payment infrastructure handling millions of transactions per day. Work with a world-class engineering team.",
    agentStatus: "tailoring",
    saved: false,
    verified: true,
  },
  {
    id: "j2",
    title: "ML Platform Engineer",
    company: "Sarvam AI",
    companyInitial: "S",
    companyColor: "#7c3aed",
    location: "Bangalore",
    workMode: "Remote",
    salary: "₹32 – 50 LPA",
    experience: "4 – 8 yrs",
    posted: "1 day ago",
    domain: "AI / ML",
    type: "Full-time",
    match: 89,
    tags: ["Python", "MLOps", "Kubernetes", "PyTorch"],
    description: "Design the ML infrastructure powering India's leading language model. Own the platform that trains and serves models at scale.",
    agentStatus: "awaiting_approval",
    saved: true,
    verified: true,
  },
  {
    id: "j3",
    title: "Backend Engineer — Payments",
    company: "CRED",
    companyInitial: "C",
    companyColor: "#0f172a",
    location: "Bangalore",
    workMode: "On-site",
    salary: "₹22 – 35 LPA",
    experience: "2 – 5 yrs",
    posted: "3 days ago",
    domain: "FinTech",
    type: "Full-time",
    match: 81,
    tags: ["Java", "Spring Boot", "Redis", "MySQL"],
    description: "Power the financial ecosystem for India's premium credit card users. Work on high-scale, low-latency payment systems.",
    agentStatus: null,
    saved: false,
    verified: true,
  },
  {
    id: "j4",
    title: "Platform Engineer",
    company: "Zepto",
    companyInitial: "Z",
    companyColor: "#f97316",
    location: "Mumbai",
    workMode: "Hybrid",
    salary: "₹20 – 30 LPA",
    experience: "2 – 4 yrs",
    posted: "5 days ago",
    domain: "E-commerce",
    type: "Full-time",
    match: 76,
    tags: ["Go", "Microservices", "Terraform", "AWS"],
    description: "Build the platform that powers 10-minute grocery delivery. Own infrastructure that directly impacts every order.",
    agentStatus: "scouting",
    saved: false,
    verified: false,
  },
  {
    id: "j5",
    title: "Senior SWE — Infrastructure",
    company: "Postman",
    companyInitial: "P",
    companyColor: "#f59e0b",
    location: "Bangalore",
    workMode: "Remote",
    salary: "₹35 – 55 LPA",
    experience: "4 – 7 yrs",
    posted: "1 week ago",
    domain: "Dev Tools",
    type: "Full-time",
    match: 72,
    tags: ["Node.js", "Go", "Kubernetes", "GCP"],
    description: "Scale the infrastructure used by 30 million developers worldwide. Help build the future of API collaboration.",
    agentStatus: null,
    saved: false,
    verified: true,
  },
  {
    id: "j6",
    title: "Backend Engineer — Core Platform",
    company: "Meesho",
    companyInitial: "M",
    companyColor: "#ec4899",
    location: "Bangalore",
    workMode: "Hybrid",
    salary: "₹18 – 28 LPA",
    experience: "1 – 3 yrs",
    posted: "2 weeks ago",
    domain: "E-commerce",
    type: "Full-time",
    match: 65,
    tags: ["Python", "Django", "MySQL", "Celery"],
    description: "Build the core commerce platform serving 150M+ users across Bharat. Own critical product features end to end.",
    agentStatus: null,
    saved: false,
    verified: true,
  },
];

const WORK_MODES  = ["Remote", "Hybrid", "On-site"];
const JOB_TYPES   = ["Full-time", "Contract", "Internship", "Part-time"];
const DATE_POSTED = ["Last 24 hrs", "Last 3 days", "Last week", "Last month"];

type NavTab = "jobs" | "companies" | "saved" | "applications";

// ── Helpers ───────────────────────────────────────────────────────
function matchColor(score: number) {
  if (score >= 85) return "text-emerald-700";
  if (score >= 70) return "text-amber-700";
  return "text-slate-500";
}

function matchBg(score: number) {
  if (score >= 85) return "bg-emerald-50 border-emerald-200";
  if (score >= 70) return "bg-amber-50 border-amber-200";
  return "bg-slate-100 border-slate-200";
}

const AGENT_BADGE_MAP: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  scouting:          { label: "Scouting",       icon: <Radio className="w-3 h-3" />,                        cls: "bg-slate-100 border-slate-200 text-slate-600" },
  tailoring:         { label: "Tailoring",       icon: <Cpu className="w-3 h-3" />,                         cls: "bg-blue-50 border-blue-200 text-blue-700" },
  awaiting_approval: { label: "Action Required", icon: <AlertCircle className="w-3 h-3 animate-pulse" />,   cls: "bg-amber-50 border-amber-200 text-amber-700" },
  submitted:         { label: "Applied",         icon: <Send className="w-3 h-3" />,                        cls: "bg-emerald-50 border-emerald-200 text-emerald-700" },
};

function AgentBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const cfg = AGENT_BADGE_MAP[status];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function WorkModeBadge({ mode }: { mode: string }) {
  const cls =
    mode === "Remote" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
    mode === "Hybrid" ? "bg-blue-50 text-blue-700 border-blue-200" :
    "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${cls}`}>
      {mode}
    </span>
  );
}

// ── Filter state shape ────────────────────────────────────────────
type Filters = {
  modes: string[];
  types: string[];
  minMatch: number;
  dateFilter: string;
  sortBy: "match" | "recent";
};

const DEFAULT_FILTERS: Filters = {
  modes: [], types: [], minMatch: 0, dateFilter: "", sortBy: "match",
};

// ── Main dashboard ────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const [jobs, setJobs]               = useState(MOCK_JOBS);
  const [search, setSearch]           = useState("");
  const [filters, setFilters]         = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeTab, setActiveTab]     = useState<NavTab>("jobs");

  // Auth user state
  const [userId, setUserId]           = useState<string | null>(null);
  const [authUser, setAuthUser]       = useState<{ name: string; initials: string; email: string; title: string } | null>(null);
  const [confirmJob, setConfirmJob]   = useState<typeof MOCK_JOBS[0] | null>(null);
  const [showNotifs, setShowNotifs]   = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const { data: missions = [], isLoading: missionsLoading } = useMissionsList();
  const { data: pulseData } = usePulseScore(userId);
  const createMission = useCreateMission();
  const qc = useQueryClient();

  // Close dropdowns when clicking elsewhere
  useEffect(() => {
    if (!showNotifs && !showUserMenu) return;
    const close = () => { setShowNotifs(false); setShowUserMenu(false); };
    document.addEventListener("click", close, { capture: true, once: true });
    return () => document.removeEventListener("click", close, { capture: true });
  }, [showNotifs, showUserMenu]);

  // Resolve real logged-in user; keep MOCK_USER as fallback for demo
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      const fullName = (data.user.user_metadata?.full_name as string | undefined)
        ?? data.user.email?.split("@")[0]
        ?? "User";
      const initials = fullName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
      setUserId(data.user.id);
      setAuthUser({
        name: fullName,
        initials,
        email: data.user.email ?? "",
        title: (data.user.user_metadata?.current_role as string | undefined) ?? MOCK_USER.title,
      });
    });
  }, []);

  const displayUser = {
    name:       authUser?.name       ?? MOCK_USER.name,
    initials:   authUser?.initials   ?? MOCK_USER.initials,
    title:      authUser?.title      ?? MOCK_USER.title,
    email:      authUser?.email      ?? "",
    pulseScore: pulseData?.total     ?? MOCK_USER.pulseScore,
    sparkline:  pulseData?.sparkline ?? MOCK_USER.sparkline,
  };

  // ── Realtime: patch the React Query cache directly ────────────
  useEffect(() => {
    const ch = supabase.channel("dashboard_missions")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "missions" }, (payload) => {
        qc.setQueryData<MissionSummary[]>(qk.missions.list(), (prev) =>
          prev?.map((m) => m.id === payload.new.id ? { ...m, status: payload.new.status } : m)
        );
        if (payload.new.status === "awaiting_approval") {
          toast.warning("Agent paused — your input is required", {
            action: {
              label: "Review",
              onClick: () => { window.location.href = `/dashboard/missions/${payload.new.id}`; },
            },
            duration: Infinity,
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  // ── Filter helpers ────────────────────────────────────────────
  const toggleFilter = useCallback(<K extends keyof Filters>(
    key: K, val: Filters[K] extends string[] ? string : never,
  ) => {
    setFilters((prev) => {
      const arr = prev[key] as string[];
      return {
        ...prev,
        [key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val],
      };
    });
  }, []);

  const setFilter = useCallback(<K extends keyof Filters>(key: K, val: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
  }, []);

  const clearFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const handleJobSelect = useCallback((id: string) => {
    setActiveJobId((prev) => prev === id ? null : id);
  }, []);

  const handleJobSave = useCallback((id: string) => {
    setJobs((prev) => prev.map((j) => j.id === id ? { ...j, saved: !j.saved } : j));
  }, []);

  const handleJobApply = useCallback((id: string) => {
    const job = jobs.find((j) => j.id === id);
    if (job) setConfirmJob(job);
  }, [jobs]);

  const handleLaunchAgent = useCallback(() => {
    if (!confirmJob) return;
    createMission.mutate(
      { job_title: confirmJob.title, company: confirmJob.company, match_score: confirmJob.match },
      {
        onSuccess: () => {
          setConfirmJob(null);
          setActiveJobId(null);
          setActiveTab("applications");
        },
      },
    );
  }, [confirmJob, createMission]);

  // ── Filtered + sorted jobs ────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...jobs];
    if (search)
      list = list.filter((j) =>
        `${j.title} ${j.company} ${j.domain}`.toLowerCase().includes(search.toLowerCase())
      );
    if (filters.modes.length)  list = list.filter((j) => filters.modes.includes(j.workMode));
    if (filters.types.length)  list = list.filter((j) => filters.types.includes(j.type));
    if (filters.minMatch > 0)  list = list.filter((j) => j.match >= filters.minMatch);
    // Sort: match descending or keep insertion order (posted order) for recent
    if (filters.sortBy === "match")
      list = [...list].sort((a, b) => b.match - a.match);
    return list;
  }, [jobs, search, filters]);

  const activeChips = [
    ...filters.modes,
    ...filters.types,
    ...(filters.minMatch > 0 ? [`Match ≥ ${filters.minMatch}%`] : []),
  ];

  // ── Active job for detail panel ───────────────────────────────
  const activeJob = useMemo(
    () => jobs.find((j) => j.id === activeJobId) ?? null,
    [jobs, activeJobId],
  );

  // ── Saved jobs ────────────────────────────────────────────────
  const savedJobs = useMemo(() => jobs.filter((j) => j.saved), [jobs]);

  // ── Companies derived from MOCK_JOBS ──────────────────────────
  const companies = useMemo(() => {
    const map = new Map<string, typeof MOCK_JOBS[0] & { openings: number }>();
    jobs.forEach((j) => {
      if (map.has(j.company)) {
        map.get(j.company)!.openings += 1;
      } else {
        map.set(j.company, { ...j, openings: 1 });
      }
    });
    return Array.from(map.values());
  }, [jobs]);

  // ── Pending missions for notification bell ────────────────────
  const pendingMissions = useMemo(
    () => missions.filter((m) => m.status === "awaiting_approval"),
    [missions],
  );

  // ── Mission summary stats ─────────────────────────────────────
  const missionStats = useMemo(() => ({
    active:  missions.filter((m) => ["scouting", "tailoring"].includes(m.status)).length,
    pending: missions.filter((m) => m.status === "awaiting_approval").length,
    applied: missions.filter((m) => m.status === "submitted").length,
  }), [missions]);

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f0f2f8] text-slate-800 flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Top Navigation ─────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-14 flex items-center px-6 gap-4 shrink-0 shadow-sm">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 mr-2">
          <div className="w-7 h-7 rounded-md bg-[#1e3060] flex items-center justify-center">
            <BarChart2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-[#1e3060] text-sm tracking-tight">Pulse-Ops</span>
        </Link>

        <Separator orientation="vertical" className="h-5 bg-slate-200" />

        {/* Search */}
        <div className="flex-1 max-w-xl relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Job title, company, or keyword..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#1e3060]/40 focus:ring-1 focus:ring-[#1e3060]/20 transition-all"
          />
        </div>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1 ml-2">
          {(["Jobs", "Companies", "Saved", "Applications"] as const).map((label) => {
            const tab = label.toLowerCase() as NavTab;
            const isActive = activeTab === tab;
            return (
              <button
                key={label}
                onClick={() => { setActiveTab(tab); setActiveJobId(null); }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive ? "bg-[#1e3060]/10 text-[#1e3060]" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}
              >
                {label}
                {label === "Saved" && savedJobs.length > 0 && (
                  <span className="ml-1.5 text-[10px] bg-[#1e3060] text-white rounded-full px-1.5 py-0.5">{savedJobs.length}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-2">

          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={() => { setShowNotifs((v) => !v); setShowUserMenu(false); }}
              className="relative p-2 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {pendingMissions.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                  {pendingMissions.length}
                </span>
              )}
            </button>
            {showNotifs && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <p className="font-semibold text-slate-800 text-sm">Notifications</p>
                  {pendingMissions.length > 0 && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                      {pendingMissions.length} pending
                    </span>
                  )}
                </div>
                {pendingMissions.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell className="w-6 h-6 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">No pending notifications</p>
                  </div>
                ) : (
                  <div>
                    {pendingMissions.map((m) => (
                      <Link
                        key={m.id}
                        href={`/dashboard/missions/${m.id}`}
                        onClick={() => setShowNotifs(false)}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-amber-50 border-b border-slate-50 last:border-0 transition-colors"
                      >
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{m.role}</p>
                          <p className="text-xs text-slate-400">{m.company} · Action required</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Settings */}
          <button
            onClick={() => router.push("/onboarding")}
            className="p-2 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User avatar + dropdown */}
          <div className="relative ml-1">
            <button
              onClick={() => { setShowUserMenu((v) => !v); setShowNotifs(false); }}
              className="w-8 h-8 rounded-full bg-[#1e3060] flex items-center justify-center text-white text-xs font-bold hover:ring-2 hover:ring-[#1e3060]/40 transition-all"
            >
              {displayUser.initials}
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="font-semibold text-slate-900 text-sm truncate">{displayUser.name}</p>
                  <p className="text-xs text-slate-400 truncate">{displayUser.email}</p>
                </div>
                <button
                  onClick={() => { router.push("/onboarding"); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <User className="w-4 h-4" /> Edit Profile
                </button>
                <button
                  onClick={() => { supabase.auth.signOut(); router.push("/"); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-slate-100"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────── */}
      <div className="flex flex-1 max-w-screen-xl mx-auto w-full px-4 py-6 gap-5">

        {/* ── LEFT SIDEBAR ─────────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col gap-4 w-60 shrink-0">

          {/* Profile card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-14 h-14 rounded-full bg-[#1e3060] flex items-center justify-center text-white font-bold text-xl mb-2">
                {displayUser.initials}
              </div>
              <div className="font-semibold text-slate-900 text-sm">{displayUser.name}</div>
              <div className="text-slate-500 text-xs mt-0.5">{displayUser.title}</div>
              <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                <MapPin className="w-3 h-3" /> {MOCK_USER.location}
              </div>
            </div>

            {/* Pulse score */}
            <div className="bg-[#f0f2f8] rounded-lg p-3 mb-3 border border-slate-100">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Pulse Score</span>
                <div className="flex items-end gap-[2px]">
                  {displayUser.sparkline.map((v, idx) => (
                    <div key={idx} className="w-1 rounded-t-sm bg-[#1e3060]/50" style={{ height: `${(v / 100) * 14}px` }} />
                  ))}
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-[#1e3060]">{displayUser.pulseScore}</span>
                <span className="text-slate-400 text-xs">/ 100</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-[#1e3060] transition-all" style={{ width: `${displayUser.pulseScore}%` }} />
              </div>
            </div>

            {/* Profile completeness */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Profile strength</span>
                <span className="font-medium">{MOCK_USER.profileComplete}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${MOCK_USER.profileComplete}%` }} />
              </div>
            </div>

            <button
              onClick={() => router.push("/onboarding")}
              className="w-full text-xs text-[#1e3060] hover:text-[#162448] transition-colors text-center py-1 font-medium"
            >
              View & edit profile →
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" /> Filters
              </span>
              {activeChips.length > 0 && (
                <button onClick={clearFilters}
                  className="text-[10px] text-slate-400 hover:text-red-500 transition-colors font-medium">
                  Clear all
                </button>
              )}
            </div>

            <FilterGroup label="Work Mode">
              {WORK_MODES.map((m) => (
                <FilterChip key={m} label={m} active={filters.modes.includes(m)}
                  onClick={() => toggleFilter("modes", m)} />
              ))}
            </FilterGroup>

            <FilterGroup label="Job Type">
              {JOB_TYPES.map((t) => (
                <FilterChip key={t} label={t} active={filters.types.includes(t)}
                  onClick={() => toggleFilter("types", t)} />
              ))}
            </FilterGroup>

            <FilterGroup label="Min Match Score">
              {[0, 60, 70, 80, 90].map((v) => (
                <FilterChip key={v} label={v === 0 ? "Any" : `≥ ${v}%`}
                  active={filters.minMatch === v} onClick={() => setFilter("minMatch", v)} />
              ))}
            </FilterGroup>

            <FilterGroup label="Date Posted" last>
              {DATE_POSTED.map((d) => (
                <FilterChip key={d} label={d} active={filters.dateFilter === d}
                  onClick={() => setFilter("dateFilter", filters.dateFilter === d ? "" : d)} />
              ))}
            </FilterGroup>
          </div>
        </aside>

        {/* ── MAIN CONTENT ─────────────────────────────────────── */}
        <main className="flex-1 min-w-0 flex flex-col gap-4">

          {/* ── Companies tab ──────────────────────────────────── */}
          {activeTab === "companies" && (
            <>
              <div>
                <span className="text-slate-900 font-semibold text-sm">{companies.length} companies</span>
                <span className="text-slate-500 text-sm"> actively hiring</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {companies.map((c) => (
                  <div key={c.company}
                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-[#1e3060]/30 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base shrink-0"
                        style={{ backgroundColor: `${c.companyColor}18`, border: `1px solid ${c.companyColor}30` }}>
                        <span style={{ color: c.companyColor === "#0f172a" ? "#334155" : c.companyColor }}>{c.companyInitial}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900 text-sm">{c.company}</span>
                          {c.verified && <CheckCircle2 className="w-3.5 h-3.5 text-[#1e3060]" />}
                        </div>
                        <div className="text-xs text-slate-400">{c.domain}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <WorkModeBadge mode={c.workMode} />
                      <span className="text-xs text-[#1e3060] font-semibold bg-[#1e3060]/10 border border-[#1e3060]/20 px-2.5 py-1 rounded-full">
                        {c.openings} opening{c.openings > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Applications tab ───────────────────────────────── */}
          {activeTab === "applications" && (
            <>
              <div>
                <span className="text-slate-900 font-semibold text-sm">{missions.length} missions</span>
                <span className="text-slate-500 text-sm"> tracked by your agent</span>
              </div>
              {missionsLoading ? (
                <div className="flex items-center justify-center py-20 text-slate-400 gap-2 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading missions…
                </div>
              ) : missions.length === 0 ? (
                <div className="text-center py-20 bg-white border border-slate-200 rounded-xl">
                  <Briefcase className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium text-slate-600">No active missions yet</p>
                  <p className="text-sm text-slate-400 mt-1">Click Auto-Apply on a job to launch an agent</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {missions.map((m) => (
                    <Link key={m.id} href={`/dashboard/missions/${m.id}`}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-[#1e3060]/30 hover:shadow-md transition-all flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
                        {m.company[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 text-sm truncate">{m.role}</div>
                        <div className="text-xs text-slate-400 truncate">{m.company}</div>
                      </div>
                      <AgentBadge status={m.status} />
                      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Jobs / Saved tab ───────────────────────────────── */}
          {(activeTab === "jobs" || activeTab === "saved") && (() => {
            const displayJobs = activeTab === "saved" ? savedJobs : filtered;
            return (
              <>
                {/* Results bar */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-slate-900 font-semibold text-sm">{displayJobs.length.toLocaleString()} {activeTab === "saved" ? "saved" : ""} jobs</span>
                    <span className="text-slate-500 text-sm">{activeTab === "saved" ? " bookmarked" : " found for you"}</span>
                  </div>
                  {activeTab === "jobs" && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => setShowFilters(!showFilters)}
                        className="lg:hidden flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 bg-white transition-colors shadow-sm">
                        <Filter className="w-3.5 h-3.5" /> Filters
                        {activeChips.length > 0 && (
                          <span className="w-4 h-4 bg-[#1e3060] rounded-full text-[9px] text-white flex items-center justify-center">
                            {activeChips.length}
                          </span>
                        )}
                      </button>
                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                        {(["match", "recent"] as const).map((s) => (
                          <button key={s} onClick={() => setFilter("sortBy", s)}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${filters.sortBy === s ? "bg-[#1e3060] text-white" : "text-slate-500 hover:text-slate-800"}`}>
                            {s === "match" ? "Best Match" : "Most Recent"}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Active filter chips */}
                {activeTab === "jobs" && activeChips.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {activeChips.map((chip) => (
                      <span key={chip} className="flex items-center gap-1 text-xs bg-[#1e3060]/10 text-[#1e3060] border border-[#1e3060]/20 px-2.5 py-1 rounded-full font-medium">
                        {chip}
                        <button onClick={() => {
                          if (chip.includes("Match")) setFilter("minMatch", 0);
                          else if (WORK_MODES.includes(chip)) toggleFilter("modes", chip);
                          else toggleFilter("types", chip);
                        }}>
                          <X className="w-3 h-3 hover:text-[#162448]" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Job cards */}
                <div className="flex flex-col gap-3">
                  {displayJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      active={activeJobId === job.id}
                      onSelect={handleJobSelect}
                      onSave={handleJobSave}
                      onApply={handleJobApply}
                    />
                  ))}
                  {displayJobs.length === 0 && activeTab === "saved" && (
                    <div className="text-center py-16 bg-white border border-slate-200 rounded-xl text-slate-400">
                      <Bookmark className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="font-medium text-slate-600">No saved jobs yet</p>
                      <p className="text-sm text-slate-400 mt-1">Bookmark jobs from the Jobs tab</p>
                    </div>
                  )}
                  {displayJobs.length === 0 && activeTab === "jobs" && (
                    <div className="text-center py-16 bg-white border border-slate-200 rounded-xl text-slate-400">
                      <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="font-medium text-slate-600">No jobs match your filters</p>
                      <button
                        onClick={() => { setSearch(""); clearFilters(); }}
                        className="mt-2 text-sm text-[#1e3060] hover:underline"
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </main>

        {/* ── RIGHT SIDEBAR ─────────────────────────────────────── */}
        <aside className="hidden xl:flex flex-col gap-4 w-64 shrink-0">

          {/* Application tracker — real data */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#1e3060]" /> My Applications
            </h3>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: "Active",  count: missionStats.active,  color: "text-blue-700 bg-blue-50 border-blue-200" },
                { label: "Pending", count: missionStats.pending, color: "text-amber-700 bg-amber-50 border-amber-200" },
                { label: "Applied", count: missionStats.applied, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
              ].map(({ label, count, color }) => (
                <div key={label} className={`rounded-lg p-2 text-center border ${color}`}>
                  <div className="text-lg font-bold">{missionsLoading ? "–" : count}</div>
                  <div className="text-[10px] opacity-70">{label}</div>
                </div>
              ))}
            </div>

            {missionsLoading ? (
              <div className="flex items-center justify-center py-4 text-slate-400 gap-2 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…
              </div>
            ) : missions.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-3">No active missions yet.</p>
            ) : (
              <div className="space-y-2.5">
                {missions.slice(0, 5).map((m) => (
                  <Link key={m.id} href={`/dashboard/missions/${m.id}`}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100 hover:border-[#1e3060]/30 hover:bg-[#1e3060]/5 transition-all block">
                    <div className="w-8 h-8 rounded-md bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                      {m.company[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-slate-800 truncate">{m.role}</div>
                      <div className="text-[10px] text-slate-400 truncate">{m.company}</div>
                      <div className="mt-1"><AgentBadge status={m.status} /></div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <button className="w-full mt-3 text-xs text-[#1e3060] hover:text-[#162448] transition-colors py-1 border-t border-slate-100 text-center pt-3 font-medium">
              View all ({missions.length}) →
            </button>
          </div>

          {/* Top companies hiring */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" /> Top Hiring Now
            </h3>
            <div className="space-y-2.5">
              {[
                { name: "Razorpay",  openings: 12, domain: "FinTech" },
                { name: "Sarvam AI", openings: 8,  domain: "AI / ML" },
                { name: "Postman",   openings: 6,  domain: "Dev Tools" },
                { name: "Meesho",    openings: 15, domain: "E-commerce" },
              ].map((c) => (
                <div key={c.name} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                  <div>
                    <div className="text-xs font-medium text-slate-800">{c.name}</div>
                    <div className="text-[10px] text-slate-400">{c.domain}</div>
                  </div>
                  <span className="text-[10px] text-[#1e3060] bg-[#1e3060]/10 border border-[#1e3060]/20 px-2 py-0.5 rounded-full font-medium">
                    {c.openings} jobs
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pulse tip */}
          <div className="bg-[#1e3060]/5 border border-[#1e3060]/15 rounded-xl p-4">
            <div className="flex items-start gap-2.5">
              <TrendingUp className="w-4 h-4 text-[#1e3060] mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-[#1e3060] mb-1">Boost your score</div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Merge a PR or solve a LeetCode problem to increase your Pulse Score and surface higher in recruiter searches.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Job detail slide-over ─────────────────────────────── */}
      {activeJob && (
        <JobDetailPanel
          job={activeJob}
          onClose={() => setActiveJobId(null)}
          onSave={handleJobSave}
          onApply={handleJobApply}
        />
      )}

      {confirmJob && (
        <ApplyConfirmModal
          job={confirmJob}
          onConfirm={handleLaunchAgent}
          onCancel={() => setConfirmJob(null)}
          isPending={createMission.isPending}
        />
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────

const JobCard = React.memo(function JobCard({
  job, active, onSelect, onSave, onApply,
}: {
  job: typeof MOCK_JOBS[0];
  active: boolean;
  onSelect: (id: string) => void;
  onSave: (id: string) => void;
  onApply: (id: string) => void;
}) {
  return (
    <div
      onClick={() => onSelect(job.id)}
      className={`bg-white border rounded-xl p-5 cursor-pointer transition-all hover:border-[#1e3060]/30 hover:shadow-md ${active ? "border-[#1e3060]/40 shadow-md" : "border-slate-200 shadow-sm"}`}
    >
      {/* Top row: company + match + save */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base shrink-0"
            style={{ backgroundColor: `${job.companyColor}18`, border: `1px solid ${job.companyColor}30` }}
          >
            <span style={{ color: job.companyColor === "#0f172a" ? "#334155" : job.companyColor }}>
              {job.companyInitial}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-900 text-sm">{job.company}</span>
              {job.verified && (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1e3060]" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <WorkModeBadge mode={job.workMode} />
              <span className="text-[10px] text-slate-400">{job.type}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className={`flex flex-col items-center px-3 py-1.5 rounded-xl border ${matchBg(job.match)}`}>
            <span className={`text-sm font-bold ${matchColor(job.match)}`}>{job.match}%</span>
            <span className="text-[9px] text-slate-400 uppercase tracking-wider">match</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onSave(job.id); }}
            className={`p-2 rounded-lg border transition-all ${job.saved ? "border-amber-300 bg-amber-50 text-amber-600" : "border-slate-200 text-slate-400 hover:text-amber-500 hover:border-amber-300"}`}
          >
            {job.saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Job title */}
      <h3 className="text-slate-900 font-semibold text-base mb-2">{job.title}</h3>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mb-3">
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" /> {job.location}
        </span>
        <span className="flex items-center gap-1">
          <DollarSign className="w-3 h-3 text-emerald-600" /> {job.salary}
        </span>
        <span className="flex items-center gap-1">
          <Briefcase className="w-3 h-3" /> {job.experience}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> {job.posted}
        </span>
      </div>

      {/* Description */}
      <p className="text-slate-500 text-xs leading-relaxed mb-3 line-clamp-2">{job.description}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {job.tags.map((tag) => (
          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
            {tag}
          </span>
        ))}
      </div>

      {/* Bottom row: agent status + actions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div>
          {job.agentStatus ? (
            <AgentBadge status={job.agentStatus} />
          ) : (
            <span className="text-[10px] text-slate-400">No active agent</span>
          )}
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <a
            href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.title + " " + job.company)}`}
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="outline" size="sm"
              className="h-7 text-xs border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 bg-white">
              <ExternalLink className="w-3 h-3 mr-1" /> View
            </Button>
          </a>
          {job.agentStatus ? (
            <Link href={`/dashboard/missions/${job.id}`}>
              <Button size="sm" className="h-7 text-xs bg-amber-500 hover:bg-amber-600 text-white border-0 shadow-sm">
                <AlertCircle className="w-3 h-3 mr-1" /> Review
              </Button>
            </Link>
          ) : (
            <Button
              size="sm"
              className="h-7 text-xs bg-[#1e3060] hover:bg-[#162448] text-white border-0 shadow-sm"
              onClick={() => onApply(job.id)}
            >
              <Zap className="w-3 h-3 mr-1" /> Auto-Apply
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

function FilterGroup({ label, children, last = false }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={`mb-4 ${!last ? "pb-4 border-b border-slate-100" : ""}`}>
      <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-2">{label}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all font-medium ${active ? "border-[#1e3060] bg-[#1e3060]/10 text-[#1e3060]" : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"}`}
    >
      {label}
    </button>
  );
}

// ── Apply confirm modal ───────────────────────────────────────────
function ApplyConfirmModal({
  job,
  onConfirm,
  onCancel,
  isPending,
}: {
  job: typeof MOCK_JOBS[0];
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 border border-slate-200">
        {/* Job header */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0"
            style={{ backgroundColor: `${job.companyColor}18`, border: `1px solid ${job.companyColor}30` }}
          >
            <span style={{ color: job.companyColor === "#0f172a" ? "#334155" : job.companyColor }}>
              {job.companyInitial}
            </span>
          </div>
          <div>
            <p className="font-bold text-slate-900">{job.title}</p>
            <p className="text-sm text-slate-500">{job.company} · {job.location}</p>
          </div>
          <div className={`ml-auto flex flex-col items-center px-3 py-1.5 rounded-xl border shrink-0 ${matchBg(job.match)}`}>
            <span className={`text-sm font-bold ${matchColor(job.match)}`}>{job.match}%</span>
            <span className="text-[9px] text-slate-400 uppercase">match</span>
          </div>
        </div>

        {/* What the agent will do */}
        <div className="bg-[#1e3060]/5 border border-[#1e3060]/15 rounded-xl p-4 mb-5">
          <p className="text-xs font-bold text-[#1e3060] uppercase tracking-widest mb-3">Your agent will</p>
          <ul className="space-y-2">
            {[
              "Tailor your resume for this role",
              "Write a personalised cover letter",
              "Fill the ATS form using your Pulse evidence",
              "Pause for your approval before final submit",
            ].map((step) => (
              <li key={step} className="flex items-center gap-2 text-sm text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                {step}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 border-slate-200 text-slate-600"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 bg-[#1e3060] hover:bg-[#162448] text-white border-0 shadow-sm"
          >
            {isPending
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Launching…</>
              : <><Zap className="w-4 h-4 mr-2" /> Launch Agent</>
            }
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Job detail slide-over panel ───────────────────────────────────
function JobDetailPanel({
  job,
  onClose,
  onSave,
  onApply,
}: {
  job: typeof MOCK_JOBS[0];
  onClose: () => void;
  onSave: (id: string) => void;
  onApply: (id: string) => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-lg bg-white shadow-2xl flex flex-col border-l border-slate-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center font-bold shrink-0"
              style={{ backgroundColor: `${job.companyColor}18`, border: `1px solid ${job.companyColor}30` }}
            >
              <span style={{ color: job.companyColor === "#0f172a" ? "#334155" : job.companyColor }}>
                {job.companyInitial}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-900">{job.company}</span>
                {job.verified && <CheckCircle2 className="w-3.5 h-3.5 text-[#1e3060]" />}
              </div>
              <div className="text-xs text-slate-400">{job.domain} · {job.type}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSave(job.id)}
              className={`p-2 rounded-lg border transition-all ${job.saved ? "border-amber-300 bg-amber-50 text-amber-600" : "border-slate-200 text-slate-400 hover:text-amber-500 hover:border-amber-300"}`}
            >
              {job.saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">

          {/* Title + match */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <h2 className="text-xl font-bold text-slate-900 leading-tight">{job.title}</h2>
            <div className={`flex flex-col items-center px-3 py-2 rounded-xl border ${matchBg(job.match)} shrink-0`}>
              <span className={`text-base font-bold ${matchColor(job.match)}`}>{job.match}%</span>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider">match</span>
            </div>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500 mb-6 pb-6 border-b border-slate-100">
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {job.location}</span>
            <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-emerald-600" /> {job.salary}</span>
            <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> {job.experience}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {job.posted}</span>
            <WorkModeBadge mode={job.workMode} />
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Building2 className="w-3 h-3" /> About the role
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">{job.description}</p>
          </div>

          {/* Tech stack */}
          <div className="mb-6">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Tech Stack</h3>
            <div className="flex flex-wrap gap-2">
              {job.tags.map((tag) => (
                <span key={tag}
                  className="px-3 py-1.5 rounded-lg bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Agent status */}
          {job.agentStatus && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-xs font-semibold text-amber-700 mb-2 uppercase tracking-widest">Agent Status</p>
              <AgentBadge status={job.agentStatus} />
              {job.agentStatus === "awaiting_approval" && (
                <p className="text-xs text-amber-600 mt-2">
                  Your agent needs input before it can proceed.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex gap-3 shrink-0">
          <a
            href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.title + " " + job.company)}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1"
          >
            <Button variant="outline" className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 bg-white">
              <ExternalLink className="w-4 h-4 mr-2" /> View Original
            </Button>
          </a>
          {job.agentStatus ? (
            <Link href={`/dashboard/missions/${job.id}`} className="flex-1">
              <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white border-0 shadow-sm">
                <AlertCircle className="w-4 h-4 mr-2" /> Review Agent
              </Button>
            </Link>
          ) : (
            <Button
              className="flex-1 bg-[#1e3060] hover:bg-[#162448] text-white border-0 shadow-sm"
              onClick={() => { onClose(); onApply(job.id); }}
            >
              <Zap className="w-4 h-4 mr-2" /> Auto-Apply
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
