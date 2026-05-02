"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft, Play, ExternalLink, Star, CheckCircle2, MapPin, Clock,
  Calendar, ClipboardList, LockOpen, Lock, UserX, Award, Briefcase,
  ChevronRight, Send, X, Loader2, BookOpen, Layers, Trophy, Video,
  MessageSquare, Users, Zap, Target,
} from "lucide-react";
import { toast } from "sonner";

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_CANDIDATES: Record<string, MockCandidate> = {
  c1: {
    id: "c1", hiddenName: "Arjun Mehta", displayName: "Candidate A.", unlocked: false,
    headline: "Senior Product Manager | Ex-Zepto, Meesho", location: "Bangalore, India",
    availability: "open", pulseScore: 92, matchScore: 92,
    skills: ["Product Strategy", "Agile", "Data Analytics", "User Research", "Go-to-Market"],
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    bio: "I build 0→1 products that balance deep user empathy with rigorous business impact. Spent 4 years shipping consumer products at scale — from last-mile logistics to social commerce. I thrive at the intersection of ambiguous problems and cross-functional execution.",
    projects: [
      { title: "Supply Chain Optimisation Platform", role: "Lead PM", description: "Built an internal tool that reduced last-mile delivery failures from 8% to 1.2% across 14 cities by introducing ML-driven route prediction and real-time driver nudges.", impact: "Saved ₹2.3Cr/month in failed delivery costs", tags: ["Supply Chain", "ML", "B2B"], url: "#" },
      { title: "Consumer App Onboarding Redesign", role: "PM + UX Partner", description: "Redesigned the new user flow from scratch after identifying a 62% D1 drop-off. Ran 14 A/B tests across 6 weeks, eventually landing on a guided discovery model.", impact: "D7 retention improved by 41%", tags: ["Growth", "UX", "A/B Testing"], url: "#" },
      { title: "Seller Analytics Dashboard", role: "Solo PM", description: "Delivered a self-serve analytics platform for 50K+ sellers that surfaced inventory health, returns data, and demand forecasting in one view.", impact: "Reduced seller support tickets by 28%", tags: ["Analytics", "B2B SaaS", "Dashboards"], url: "#" },
    ],
    caseStudies: [
      { title: "Cutting Last-Mile Failure Rate by 85%", problem: "8% of orders were failing post-dispatch — a ₹4Cr/month problem. Root cause analysis showed 60% were address ambiguity issues, 25% driver navigation errors.", approach: "Partnered with ML team to build an address confidence scorer. Introduced a pre-dispatch verification step for low-confidence addresses. Gamified driver navigation compliance with weekly bonuses.", outcome: "Failure rate dropped from 8% to 1.2% over 12 weeks without increasing delivery time.", impact: "₹2.3Cr/month saved", tags: ["Operations", "ML", "Growth"] },
      { title: "Revamping Onboarding to Kill D7 Churn", problem: "62% of new users who installed the app never completed a first purchase within 7 days. Cohort analysis showed the drop happened at the category selection screen.", approach: "Ran 14 A/B tests over 6 weeks. Replaced the overwhelming 200-category grid with a 4-question interest quiz. Introduced social proof cards (\"12,000 people in Bangalore buy this\").", outcome: "D7 retention improved 41%. First purchase conversion went from 38% to 61% in 8 weeks.", impact: "+41% D7 retention", tags: ["Growth", "UX", "Retention"] },
    ],
    awards: [
      { title: "Best Product Launch of the Year", issuer: "Zepto", year: 2025, type: "award", description: "Awarded for shipping the Supply Chain Optimisation Platform that saved ₹2.3Cr/month." },
      { title: "Certified Product Manager (CPM)", issuer: "Product School", year: 2024, type: "certification", credential: "https://productschool.com" },
      { title: "Top 1% Performer, Q1 2026", issuer: "Meesho", year: 2026, type: "recognition", description: "Rated in the top 1% of 400+ PMs across performance, collaboration, and impact metrics." },
    ],
  },
  c2: {
    id: "c2", hiddenName: "Sarah Jenkins", displayName: "Sarah Jenkins", unlocked: true,
    headline: "Senior Data Scientist | ML & Growth Analytics", location: "Remote (UK-based)",
    availability: "2_weeks", pulseScore: 88, matchScore: 88,
    skills: ["Python", "Machine Learning", "SQL", "A/B Testing", "Tableau", "AWS"],
    videoUrl: "",
    bio: "I turn messy data into decisions. 6 years building ML models and growth analytics frameworks across fintech and e-commerce. Passionate about making data accessible to non-technical stakeholders.",
    projects: [
      { title: "Customer Churn Prediction Model", role: "Lead Data Scientist", description: "Built and deployed an XGBoost churn model that predicted 30-day churn with 89% accuracy, enabling proactive outreach campaigns.", impact: "Reduced churn by 23% in 6 months", tags: ["ML", "Python", "CRM"], url: "#" },
      { title: "Revenue Attribution Framework", role: "Data Scientist", description: "Designed a multi-touch attribution model replacing last-click, giving marketing teams real ROI visibility across 8 channels.", impact: "Reallocated $2M budget, 34% better ROAS", tags: ["Analytics", "Marketing", "SQL"], url: "#" },
    ],
    caseStudies: [
      { title: "Building a Churn Early Warning System", problem: "Marketing was running win-back campaigns on already-churned users — expensive and ineffective. No predictive signal existed.", approach: "Built a feature engineering pipeline on 18 months of behavioural data. Trained XGBoost with SHAP explanations for each prediction. Integrated into CRM via API so CSMs could act on alerts.", outcome: "23% churn reduction. CSM team could focus on at-risk, not churned, users.", impact: "-23% churn", tags: ["ML", "CRM", "Growth"] },
    ],
    awards: [
      { title: "AWS Certified Machine Learning Specialty", issuer: "Amazon Web Services", year: 2024, type: "certification", credential: "https://aws.amazon.com" },
      { title: "Best Analytics Project", issuer: "DataFest London", year: 2023, type: "award", description: "Won for the revenue attribution framework presented at DataFest 2023." },
    ],
  },
  c3: {
    id: "c3", hiddenName: "Rohan Sharma", displayName: "Candidate X.", unlocked: false,
    headline: "UX/Product Designer | B2B SaaS & Fintech", location: "Mumbai, India",
    availability: "1_month", pulseScore: 84, matchScore: 84,
    skills: ["Figma", "UX Research", "Design Systems", "Prototyping", "Usability Testing"],
    videoUrl: "",
    bio: "Designer who codes (a little). I care deeply about the gap between what teams build and what users actually need. 5 years in B2B SaaS and fintech, where I've learned that good design is mostly good listening.",
    projects: [
      { title: "Design System — 0 to 1", role: "Lead Designer", description: "Built the company's first design system from scratch — 120+ components, tokens, and documentation — adopted by 5 product teams.", impact: "60% faster design-to-dev handoff", tags: ["Design Systems", "Figma", "B2B"], url: "#" },
    ],
    caseStudies: [
      { title: "Redesigning B2B Onboarding for Enterprise Clients", problem: "Enterprise clients were abandoning setup 3 days in — IT teams found the initial configuration overwhelming.", approach: "Ran 12 discovery interviews with IT admins. Mapped a 40-step setup into 5 guided milestones with progress checkpoints and a 'save and resume' feature.", outcome: "Setup completion rate improved from 41% to 79%. Time-to-first-value cut from 11 days to 4 days.", impact: "+38pp setup completion", tags: ["Enterprise UX", "Onboarding"] },
    ],
    awards: [
      { title: "Google UX Design Certificate", issuer: "Google / Coursera", year: 2023, type: "certification", credential: "https://coursera.org" },
    ],
  },
  c4: {
    id: "c4", hiddenName: "Priya Nair", displayName: "Candidate Y.", unlocked: false,
    headline: "Operations & Strategy Lead | Supply Chain & Logistics", location: "Hyderabad, India",
    availability: "open", pulseScore: 75, matchScore: 75,
    skills: ["Operations Strategy", "Process Improvement", "SQL", "Lean Six Sigma", "Vendor Management"],
    videoUrl: "",
    bio: "Ops leader who has run teams of 40+ and re-engineered processes that save time and money at scale. Background in supply chain and logistics — I find inefficiency deeply offensive.",
    projects: [
      { title: "Warehouse Automation Roadmap", role: "Strategy Lead", description: "Authored a 3-year automation roadmap across 8 warehouses, prioritising ROI by warehouse volume and error rate.", impact: "Projected ₹6Cr savings over 3 years", tags: ["Operations", "Automation", "Strategy"], url: "#" },
    ],
    caseStudies: [],
    awards: [
      { title: "Lean Six Sigma Green Belt", issuer: "IASSC", year: 2023, type: "certification", credential: "#" },
    ],
  },
};

type MockCandidate = {
  id: string; hiddenName: string; displayName: string; unlocked: boolean;
  headline: string; location: string; availability: string;
  pulseScore: number; matchScore: number; skills: string[];
  videoUrl: string; bio: string;
  projects: { title: string; role: string; description: string; impact: string; tags: string[]; url: string }[];
  caseStudies: { title: string; problem: string; approach: string; outcome: string; impact: string; tags: string[] }[];
  awards: { title: string; issuer: string; year: number; type: string; description?: string; credential?: string }[];
};

const AVAILABILITY_LABEL: Record<string, { label: string; color: string }> = {
  open:       { label: "Open to work", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  "2_weeks":  { label: "Available in 2 weeks", color: "bg-blue-100 text-blue-700 border-blue-200" },
  "1_month":  { label: "Available in 1 month", color: "bg-amber-100 text-amber-700 border-amber-200" },
  not_looking:{ label: "Not actively looking", color: "bg-slate-100 text-slate-600 border-slate-200" },
};

const AWARD_TYPE_ICON: Record<string, React.ReactNode> = {
  award:        <Trophy className="w-4 h-4 text-amber-500" />,
  certification:<CheckCircle2 className="w-4 h-4 text-blue-500" />,
  recognition:  <Star className="w-4 h-4 text-purple-500" />,
  publication:  <BookOpen className="w-4 h-4 text-emerald-500" />,
};

type Tab = "overview" | "projects" | "casestudies" | "achievements";

function getYouTubeId(url: string) {
  const match = url.match(/(?:embed\/|v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

// ─── Schedule Meet Modal ───────────────────────────────────────────────────────
function ScheduleMeetModal({ candidate, onClose, onSend }: { candidate: MockCandidate; onClose: () => void; onSend: (data: object) => void }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState("30");
  const [meetType, setMeetType] = useState("video");
  const [message, setMessage] = useState(`Hi ${candidate.hiddenName.split(" ")[0]},\n\nI'd love to connect and learn more about your background. Would you be available for a quick chat?\n\nLooking forward to it!`);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!date) { toast.error("Please select a date."); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    onSend({ date, time, duration, meetType, message });
    setLoading(false);
    onClose();
    toast.success("Meeting invite sent!", { description: `Scheduled for ${date} at ${time}` });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Schedule a Meeting</h3>
              <p className="text-xs text-slate-500">with {candidate.unlocked ? candidate.hiddenName : "this candidate"}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Meeting type */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">Meeting Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[{ id: "video", label: "Video Call", icon: <Video className="w-4 h-4" /> }, { id: "phone", label: "Phone Call", icon: <MessageSquare className="w-4 h-4" /> }, { id: "in_person", label: "In Person", icon: <Users className="w-4 h-4" /> }].map(t => (
                <button key={t.id} onClick={() => setMeetType(t.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-sm font-medium transition-all ${meetType === t.id ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400" />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">Duration</label>
            <div className="flex gap-2">
              {["30", "45", "60"].map(d => (
                <button key={d} onClick={() => setDuration(d)}
                  className={`flex-1 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${duration === d ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                  {d} min
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Message to Candidate</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400" />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors">Cancel</button>
          <button onClick={handleSend} disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all disabled:opacity-70">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? "Sending..." : "Send Invite"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Send Test Modal ───────────────────────────────────────────────────────────
const TEST_TYPES = [
  { id: "skills", label: "Skills Assessment", desc: "Evaluate core role-specific skills", icon: <Zap className="w-5 h-5" />, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { id: "scenario", label: "Scenario Challenge", desc: "Real-world problem-solving task", icon: <Target className="w-5 h-5" />, color: "text-purple-600 bg-purple-50 border-purple-200" },
  { id: "culture", label: "Culture Fit Survey", desc: "Values and work-style alignment", icon: <Users className="w-5 h-5" />, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { id: "domain", label: "Domain Knowledge Quiz", desc: "Industry-specific knowledge check", icon: <BookOpen className="w-5 h-5" />, color: "text-amber-600 bg-amber-50 border-amber-200" },
];

function SendTestModal({ candidate, onClose, onSend }: { candidate: MockCandidate; onClose: () => void; onSend: (data: object) => void }) {
  const [testType, setTestType] = useState("skills");
  const [deadline, setDeadline] = useState("");
  const [message, setMessage] = useState(`Hi ${candidate.hiddenName.split(" ")[0]},\n\nAs a next step in our process, we'd love for you to complete a short assessment. It should take around 30–45 minutes.\n\nNo preparation needed — just your honest, natural response.`);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!deadline) { toast.error("Please set a deadline."); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    onSend({ testType, deadline, message });
    setLoading(false);
    onClose();
    toast.success("Preliminary test sent!", { description: `Deadline: ${deadline}` });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Send Preliminary Test</h3>
              <p className="text-xs text-slate-500">to {candidate.unlocked ? candidate.hiddenName : "this candidate"}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Test type */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">Assessment Type</label>
            <div className="grid grid-cols-2 gap-2">
              {TEST_TYPES.map(t => (
                <button key={t.id} onClick={() => setTestType(t.id)}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${testType === t.id ? "border-purple-500 bg-purple-50" : "border-slate-200 hover:border-slate-300"}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${testType === t.id ? t.color : "text-slate-400 bg-slate-50 border-slate-200"}`}>{t.icon}</div>
                  <div>
                    <p className={`text-sm font-semibold leading-tight ${testType === t.id ? "text-purple-700" : "text-slate-700"}`}>{t.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Completion Deadline</label>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} min={new Date().toISOString().split("T")[0]}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400" />
          </div>

          {/* Message */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Message to Candidate</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400" />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors">Cancel</button>
          <button onClick={handleSend} disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold flex items-center gap-2 shadow-md shadow-purple-600/20 transition-all disabled:opacity-70">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? "Sending..." : "Send Test"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function CandidateAuditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [candidate, setCandidate] = useState<MockCandidate | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [shortlisted, setShortlisted] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showMeet, setShowMeet] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [actionsDone, setActionsDone] = useState<string[]>([]);

  useEffect(() => {
    // Try Supabase first for real UUIDs, fall back to mock
    const loadCandidate = async () => {
      const mock = MOCK_CANDIDATES[id];
      if (mock) { setCandidate(mock); setUnlocked(mock.unlocked); return; }

      // Fetch real candidate from Supabase
      const { data: cp } = await supabase
        .from("candidate_profiles")
        .select(`*, candidate_projects(*), candidate_case_studies(*), candidate_awards(*), users!inner(full_name, email)`)
        .eq("user_id", id)
        .single();

      if (cp) {
        setCandidate({
          id,
          hiddenName: (cp as any).users?.full_name ?? "Candidate",
          displayName: "Candidate",
          unlocked: false,
          headline: (cp as any).headline ?? "",
          location: (cp as any).location ?? "",
          availability: (cp as any).availability ?? "open",
          pulseScore: 80,
          matchScore: 80,
          skills: [],
          videoUrl: (cp as any).video_url ?? "",
          bio: (cp as any).bio ?? "",
          projects: ((cp as any).candidate_projects ?? []).map((p: any) => ({
            title: p.title, role: p.role_in_project ?? "", description: p.description ?? "",
            impact: p.impact_metric ?? "", tags: p.tech_tags ?? [], url: p.project_url ?? "#",
          })),
          caseStudies: ((cp as any).candidate_case_studies ?? []).map((c: any) => ({
            title: c.title, problem: c.problem ?? "", approach: c.approach ?? "",
            outcome: c.outcome ?? "", impact: c.impact_metric ?? "", tags: c.tags ?? [],
          })),
          awards: ((cp as any).candidate_awards ?? []).map((a: any) => ({
            title: a.title, issuer: a.issuer ?? "", year: a.award_year ?? new Date().getFullYear(),
            type: a.award_type ?? "award", description: a.description, credential: a.credential_url,
          })),
        });
      }
    };
    if (id) loadCandidate();
  }, [id]);

  const handleUnlock = async () => {
    setUnlocking(true);
    await new Promise(r => setTimeout(r, 1400));
    setUnlocked(true);
    setShortlisted(true);
    setUnlocking(false);
    toast.success("Contact unlocked!", { description: `${candidate?.hiddenName} added to your shortlist.` });
  };

  const handleAction = (action: string, data?: object) => {
    setActionsDone(prev => [...prev, action]);
    // Save to Supabase if real user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && id && !MOCK_CANDIDATES[id]) {
        supabase.from("recruiter_candidate_actions").insert({
          recruiter_id: user.id, candidate_id: id, action_type: action, metadata: data ?? {},
        }).then(() => {});
      }
    });
  };

  if (!candidate) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
      </div>
    );
  }

  const avail = AVAILABILITY_LABEL[candidate.availability] ?? AVAILABILITY_LABEL.open;
  const initials = candidate.hiddenName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const ytId = candidate.videoUrl ? getYouTubeId(candidate.videoUrl) : null;
  const displayName = unlocked ? candidate.hiddenName : candidate.displayName;

  const TABS: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "overview",      label: "Overview",     icon: <Layers className="w-4 h-4" /> },
    { id: "projects",      label: "Projects",     icon: <Briefcase className="w-4 h-4" />,  count: candidate.projects.length },
    { id: "casestudies",   label: "Case Studies", icon: <BookOpen className="w-4 h-4" />,   count: candidate.caseStudies.length },
    { id: "achievements",  label: "Achievements", icon: <Award className="w-4 h-4" />,      count: candidate.awards.length },
  ];

  return (
    <div className="flex-1 bg-slate-50 min-h-0 overflow-auto">
      {/* Hero */}
      <div className="bg-[#0f172a] text-white">
        <div className="max-w-7xl mx-auto px-6 pt-6 pb-0">
          {/* Back */}
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Talent Feed
          </button>

          <div className="flex items-start justify-between gap-6 pb-8">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-[#1e3060] flex items-center justify-center text-2xl font-black text-white shadow-xl">
                  {unlocked ? initials : "?"}
                </div>
                {candidate.availability === "open" && (
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#0f172a]" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-black tracking-tight">{displayName}</h1>
                  {!unlocked && <span className="text-xs bg-white/10 text-slate-300 px-2 py-0.5 rounded-full font-medium">Identity hidden</span>}
                  {shortlisted && <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1"><Star className="w-3 h-3" />Shortlisted</span>}
                </div>
                <p className="text-blue-300 font-semibold text-sm">{candidate.headline}</p>
                <div className="flex items-center gap-4 mt-2.5">
                  <span className="flex items-center gap-1.5 text-slate-400 text-xs"><MapPin className="w-3.5 h-3.5" />{candidate.location}</span>
                  <span className={`text-xs border px-2.5 py-0.5 rounded-full font-semibold ${avail.color}`}>{avail.label}</span>
                  <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold"><CheckCircle2 className="w-3.5 h-3.5" />Verified by CareerOps</span>
                </div>
                {/* Skills */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {candidate.skills.map(s => (
                    <span key={s} className="text-xs bg-white/10 text-slate-300 px-2.5 py-1 rounded-lg font-medium">{s}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Pulse score */}
            <div className="shrink-0 text-right">
              <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Pulse Score</div>
              <div className="text-6xl font-black text-white tracking-tight leading-none">{candidate.pulseScore}</div>
              <div className="text-slate-500 text-sm mt-1">/ 100</div>
              <div className="mt-2">
                <div className="w-24 h-2 bg-white/10 rounded-full ml-auto overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full" style={{ width: `${candidate.pulseScore}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 border-b border-white/10">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all ${activeTab === tab.id ? "border-blue-400 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
                {tab.icon}{tab.label}
                {tab.count !== undefined && <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? "bg-blue-500/30 text-blue-300" : "bg-white/10 text-slate-500"}`}>{tab.count}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8 items-start">
          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <>
                {/* Intro Video */}
                {candidate.videoUrl ? (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                      <Video className="w-4 h-4 text-blue-600" />
                      <h2 className="font-bold text-slate-900">Introduction Video</h2>
                    </div>
                    {ytId ? (
                      <div className="aspect-video bg-slate-900">
                        <iframe src={`https://www.youtube.com/embed/${ytId}`} title="Candidate intro" className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                      </div>
                    ) : (
                      <div className="p-6 flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center">
                          <Play className="w-7 h-7 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">Intro video available</p>
                          <a href={candidate.videoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1">
                            Watch on Loom / YouTube <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                      <Video className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-slate-400 text-sm">This candidate hasn&apos;t added an intro video yet.</p>
                  </div>
                )}

                {/* Bio */}
                {candidate.bio && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-blue-600" />About</h2>
                    <p className="text-slate-600 leading-relaxed">{candidate.bio}</p>
                  </div>
                )}

                {/* Match breakdown */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-blue-600" />Match Breakdown</h2>
                  <div className="space-y-3.5">
                    {[
                      { label: "Skills Alignment", score: Math.round(candidate.matchScore * 0.98) },
                      { label: "Experience Level", score: Math.round(candidate.matchScore * 0.94) },
                      { label: "Domain Expertise", score: Math.round(candidate.matchScore * 0.89) },
                      { label: "Culture Signals", score: Math.round(candidate.matchScore * 0.85) },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-4">
                        <span className="text-sm text-slate-600 w-40 shrink-0">{item.label}</span>
                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all" style={{ width: `${item.score}%` }} />
                        </div>
                        <span className="text-sm font-bold text-slate-700 w-10 text-right">{item.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick project & case study previews */}
                {candidate.projects.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-bold text-slate-900 flex items-center gap-2"><Briefcase className="w-4 h-4 text-blue-600" />Featured Project</h2>
                      <button onClick={() => setActiveTab("projects")} className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline">View all <ChevronRight className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-slate-900">{candidate.projects[0].title}</h3>
                          <p className="text-xs text-blue-600 font-semibold mt-0.5">{candidate.projects[0].role}</p>
                          <p className="text-sm text-slate-600 mt-2 leading-relaxed">{candidate.projects[0].description}</p>
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {candidate.projects[0].tags.map(t => <span key={t} className="text-xs bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{t}</span>)}
                          </div>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center shrink-0 min-w-[100px]">
                          <Zap className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                          <p className="text-xs font-bold text-emerald-700 leading-tight">{candidate.projects[0].impact}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* PROJECTS TAB */}
            {activeTab === "projects" && (
              <div className="space-y-4">
                {candidate.projects.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                    <Briefcase className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400">No projects added yet.</p>
                  </div>
                ) : candidate.projects.map((proj, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-slate-900 text-lg">{proj.title}</h3>
                          {i === 0 && <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">Featured</span>}
                        </div>
                        <p className="text-sm font-semibold text-blue-600 mb-3">{proj.role}</p>
                        <p className="text-slate-600 leading-relaxed">{proj.description}</p>
                        <div className="flex flex-wrap gap-1.5 mt-4">
                          {proj.tags.map(t => <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">{t}</span>)}
                        </div>
                        {proj.url && proj.url !== "#" && (
                          <a href={proj.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold mt-3 hover:underline">
                            View Project <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center shrink-0 min-w-[120px]">
                        <div className="text-xs text-emerald-600 font-bold uppercase tracking-wide mb-1">Impact</div>
                        <div className="text-sm font-bold text-emerald-800 leading-snug">{proj.impact}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CASE STUDIES TAB */}
            {activeTab === "casestudies" && (
              <div className="space-y-4">
                {candidate.caseStudies.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                    <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400">No case studies added yet.</p>
                  </div>
                ) : candidate.caseStudies.map((cs, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-start justify-between gap-4">
                      <h3 className="font-bold text-slate-900 text-lg">{cs.title}</h3>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 shrink-0">
                        <span className="text-xs font-bold text-emerald-700">{cs.impact}</span>
                      </div>
                    </div>
                    <div className="p-6 space-y-5">
                      {[
                        { label: "🎯 The Problem", content: cs.problem },
                        { label: "⚙️ My Approach", content: cs.approach },
                        { label: "✅ The Outcome", content: cs.outcome },
                      ].map(section => section.content && (
                        <div key={section.label}>
                          <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">{section.label}</h4>
                          <p className="text-slate-700 leading-relaxed">{section.content}</p>
                        </div>
                      ))}
                      {cs.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                          {cs.tags.map(t => <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">{t}</span>)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ACHIEVEMENTS TAB */}
            {activeTab === "achievements" && (
              <div className="space-y-4">
                {candidate.awards.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                    <Trophy className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400">No awards or certifications added yet.</p>
                  </div>
                ) : candidate.awards.map((award, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-start gap-5">
                    <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                      {AWARD_TYPE_ICON[award.type] ?? <Award className="w-4 h-4 text-slate-400" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-slate-900">{award.title}</h3>
                          <p className="text-sm text-slate-500 mt-0.5">{award.issuer} · {award.year}</p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border capitalize ${award.type === "certification" ? "bg-blue-50 text-blue-700 border-blue-200" : award.type === "award" ? "bg-amber-50 text-amber-700 border-amber-200" : award.type === "recognition" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                          {award.type}
                        </span>
                      </div>
                      {award.description && <p className="text-sm text-slate-600 mt-2 leading-relaxed">{award.description}</p>}
                      {award.credential && award.credential !== "#" && (
                        <a href={award.credential} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold mt-2 hover:underline">
                          View Credential <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Sidebar */}
          <div className="w-72 shrink-0 space-y-4 sticky top-8">
            {/* Primary actions */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Take Action</h3>

              <button onClick={() => setShowMeet(true)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-blue-600/20">
                <Calendar className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">Schedule a Meeting</span>
                {actionsDone.includes("schedule_meet") && <CheckCircle2 className="w-4 h-4 opacity-70" />}
              </button>

              <button onClick={() => setShowTest(true)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-purple-600/20">
                <ClipboardList className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">Send Preliminary Test</span>
                {actionsDone.includes("send_test") && <CheckCircle2 className="w-4 h-4 opacity-70" />}
              </button>

              {!shortlisted ? (
                <button onClick={() => { setShortlisted(true); handleAction("shortlist"); toast.success("Candidate shortlisted!"); }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-semibold text-sm transition-all">
                  <Star className="w-4 h-4 shrink-0" /> Shortlist Candidate
                </button>
              ) : (
                <div className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Shortlisted
                </div>
              )}

              {!unlocked ? (
                <button onClick={handleUnlock} disabled={unlocking}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-70">
                  {unlocking ? <Loader2 className="w-4 h-4 animate-spin" /> : <LockOpen className="w-4 h-4 shrink-0" />}
                  {unlocking ? "Unlocking..." : "Unlock Contact"}
                </button>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <p className="text-xs text-slate-500 font-semibold mb-1 flex items-center gap-1.5"><LockOpen className="w-3.5 h-3.5 text-emerald-500" />Contact unlocked</p>
                  <p className="text-sm font-bold text-slate-800">{candidate.hiddenName}</p>
                  <p className="text-xs text-blue-600 mt-0.5">arjun.mehta@example.com</p>
                </div>
              )}

              <button onClick={() => { toast.info("Candidate passed."); router.back(); }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl font-semibold text-sm transition-all">
                <UserX className="w-4 h-4 shrink-0" /> Pass Candidate
              </button>
            </div>

            {/* Stats card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Profile Stats</h3>
              <div className="space-y-3">
                {[
                  { label: "Projects", value: candidate.projects.length, icon: <Briefcase className="w-3.5 h-3.5" /> },
                  { label: "Case Studies", value: candidate.caseStudies.length, icon: <BookOpen className="w-3.5 h-3.5" /> },
                  { label: "Achievements", value: candidate.awards.length, icon: <Trophy className="w-3.5 h-3.5" /> },
                  { label: "Match Score", value: `${candidate.matchScore}%`, icon: <Target className="w-3.5 h-3.5" /> },
                ].map(stat => (
                  <div key={stat.label} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-slate-500">{stat.icon}{stat.label}</span>
                    <span className="text-sm font-bold text-slate-800">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className={`rounded-2xl border px-5 py-4 ${avail.color}`}>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide opacity-70">Availability</p>
                  <p className="font-bold text-sm">{avail.label}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showMeet && <ScheduleMeetModal candidate={candidate} onClose={() => setShowMeet(false)} onSend={(d) => handleAction("schedule_meet", d)} />}
      {showTest && <SendTestModal candidate={candidate} onClose={() => setShowTest(false)} onSend={(d) => handleAction("send_test", d)} />}
    </div>
  );
}
