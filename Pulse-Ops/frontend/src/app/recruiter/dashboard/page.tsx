"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Users,
  Star,
  Lock,
  TrendingUp,
  Target,
  Briefcase,
  BarChart2,
  ChevronRight,
  MapPin,
  DollarSign,
  Clock,
  ArrowRight,
  Building2,
  Zap,
} from "lucide-react";

interface RecruiterProfile {
  companyName: string;
  industry: string;
  companySize: string;
  website: string;
  recruiterName: string;
  recruiterTitle: string;
  notifEmail: string;
}

interface RecruiterRole {
  id: string;
  title: string;
  skills: string[];
  experience: string;
  salary: string;
  locationModel: string;
  description: string;
  industry: string;
  status: string;
  candidateCount: number;
  shortlisted: number;
  unlocked: number;
  createdAt: string;
}

const mockCandidates = [
  {
    id: "c1",
    name: "Candidate A.",
    hiddenName: "Arjun Mehta",
    unlocked: false,
    roleMatchScore: 92,
    skills: ["FastAPI", "Kafka", "PostgreSQL"],
    lastActive: "2 hrs ago",
  },
  {
    id: "c2",
    name: "Sarah Jenkins",
    hiddenName: "Sarah Jenkins",
    unlocked: true,
    roleMatchScore: 88,
    skills: ["Python", "AWS", "Docker"],
    lastActive: "1 day ago",
  },
  {
    id: "c3",
    name: "Candidate X.",
    hiddenName: "Rohan Sharma",
    unlocked: false,
    roleMatchScore: 84,
    skills: ["FastAPI", "React", "TypeScript"],
    lastActive: "3 days ago",
  },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 90
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : score >= 80
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-slate-50 text-slate-600 border-slate-200";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${color}`}
    >
      {score}% match
    </span>
  );
}

export default function RecruiterDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<RecruiterProfile | null>(null);
  const [roles, setRoles] = useState<RecruiterRole[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("recruiter_profile");
    const rawRoles = localStorage.getItem("recruiter_roles");
    const onboarded = localStorage.getItem("recruiter_onboarded");

    if (!onboarded || onboarded !== "true" || !raw) {
      router.push("/recruiter/onboarding");
      return;
    }

    try {
      const p: RecruiterProfile = JSON.parse(raw);
      const r: RecruiterRole[] = rawRoles ? JSON.parse(rawRoles) : [];
      setProfile(p);
      setRoles(r);
    } catch {
      router.push("/recruiter/onboarding");
      return;
    }
    setLoaded(true);
  }, [router]);

  if (!loaded || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const totalShortlisted = roles.reduce((acc, r) => acc + (r.shortlisted || 0), 0);
  const totalUnlocked = roles.reduce((acc, r) => acc + (r.unlocked || 0), 0);
  const totalMatched = roles.reduce((acc, r) => acc + (r.candidateCount || 0), 0);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const statCards = [
    {
      label: "Matched Candidates",
      value: totalMatched,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Shortlisted",
      value: totalShortlisted,
      icon: Star,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Unlocked Contacts",
      value: totalUnlocked,
      icon: Lock,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Active Roles",
      value: roles.length,
      icon: Briefcase,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  const pipeline = [
    { label: "Matched", value: totalMatched, color: "bg-blue-500" },
    { label: "Reviewed", value: Math.floor(totalMatched * 0.6), color: "bg-indigo-500" },
    { label: "Shortlisted", value: totalShortlisted || 12, color: "bg-violet-500" },
    { label: "Unlocked", value: totalUnlocked || 3, color: "bg-purple-500" },
    { label: "Hired", value: 0, color: "bg-emerald-500" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Welcome bar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back, {profile.recruiterName}!
            </h1>
            <p className="text-slate-500 mt-1 text-sm">{today}</p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-sm font-medium text-slate-700">
              Your matching engine is live
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4"
              >
                <div className={`w-11 h-11 rounded-lg ${card.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main content: roles + pipeline + recent matches */}
          <div className="col-span-2 space-y-6">
            {/* Active Roles */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  Active Roles
                </h2>
                <Link href="/recruiter/jobs">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs font-semibold shadow-sm shadow-blue-600/20"
                  >
                    + Post New Role
                  </Button>
                </Link>
              </div>
              <div className="divide-y divide-slate-50">
                {roles.length === 0 ? (
                  <div className="px-6 py-10 text-center text-slate-400 text-sm">
                    No active roles yet.{" "}
                    <Link
                      href="/recruiter/jobs"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Post your first role →
                    </Link>
                  </div>
                ) : (
                  roles.map((r) => (
                    <div key={r.id} className="px-6 py-4 hover:bg-slate-50/60 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h3 className="font-semibold text-slate-900 text-sm truncate">
                              {r.title}
                            </h3>
                            <Badge
                              className={`text-[10px] px-1.5 h-4 shrink-0 ${
                                r.status === "active"
                                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                  : "bg-slate-100 text-slate-500 border-slate-200"
                              }`}
                            >
                              {r.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mb-2.5">
                            {r.locationModel && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {r.locationModel}
                              </span>
                            )}
                            {r.experience && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {r.experience}
                              </span>
                            )}
                            {r.salary && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                {r.salary}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {r.skills.slice(0, 5).map((s) => (
                              <Badge
                                key={s}
                                variant="secondary"
                                className="bg-slate-100 text-slate-600 border-slate-200 text-[10px] px-2 py-0.5"
                              >
                                {s}
                              </Badge>
                            ))}
                            {r.skills.length > 5 && (
                              <Badge
                                variant="secondary"
                                className="bg-slate-100 text-slate-500 border-slate-200 text-[10px] px-2 py-0.5"
                              >
                                +{r.skills.length - 5} more
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-blue-500" />
                              <span className="font-semibold text-blue-600">{r.candidateCount}</span> matched
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-500" />
                              <span className="font-semibold text-slate-700">{r.shortlisted}</span> shortlisted
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <Link href="/recruiter/feed">
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs font-semibold w-full"
                            >
                              View Feed <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          </Link>
                          <Link href="/recruiter/jobs">
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-white border-slate-200 text-slate-600 h-8 text-xs w-full"
                            >
                              Edit Role
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Pipeline overview */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-5">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Hiring Pipeline
              </h2>
              <div className="flex items-stretch gap-0">
                {pipeline.map((stage, idx) => (
                  <React.Fragment key={stage.label}>
                    <div className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className={`w-full rounded-lg ${stage.color} bg-opacity-10 border border-opacity-20 py-4 flex flex-col items-center gap-1`}
                        style={{
                          backgroundColor: `${stage.color.replace("bg-", "")}10`,
                        }}
                      >
                        <p className="text-xl font-bold text-slate-900">{stage.value}</p>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                          {stage.label}
                        </p>
                        <div className={`w-2 h-2 rounded-full ${stage.color} mt-1`} />
                      </div>
                    </div>
                    {idx < pipeline.length - 1 && (
                      <div className="flex items-center px-1">
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Recent Matches */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  Recent Matches
                </h2>
                <Link
                  href="/recruiter/feed"
                  className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y divide-slate-50">
                {mockCandidates.map((c) => (
                  <div
                    key={c.id}
                    className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                      {c.unlocked ? getInitials(c.hiddenName) : "?"}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-slate-900">
                          {c.unlocked ? c.hiddenName : c.name + " (Hidden)"}
                        </span>
                        {!c.unlocked && (
                          <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                        )}
                        <ScoreBadge score={c.roleMatchScore} />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {c.skills.slice(0, 2).map((s) => (
                          <Badge
                            key={s}
                            variant="secondary"
                            className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 border-slate-200"
                          >
                            {s}
                          </Badge>
                        ))}
                        <span className="text-xs text-slate-400 self-center ml-1">
                          {c.lastActive}
                        </span>
                      </div>
                    </div>

                    {/* Action */}
                    <Link href="/recruiter/feed">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white border-slate-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 h-8 text-xs shrink-0"
                      >
                        View Audit
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar: Quick actions */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  Quick Actions
                </h2>
              </div>
              <div className="p-3 space-y-1">
                <Link href="/recruiter/jobs" className="block">
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left group">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 flex-1">
                      Post a New Role
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </Link>

                <Link href="/recruiter/feed" className="block">
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left group">
                    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                      <Users className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 flex-1">
                      View Talent Feed
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </Link>

                <Link href="/recruiter/feed" className="block">
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left group">
                    <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
                      <Star className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 flex-1">
                      Shortlisted Candidates
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </Link>

                <button
                  onClick={() => toast.info("Report generation coming soon")}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left group"
                >
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                    <BarChart2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 flex-1">
                    Download Report
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Company info card */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                  <Building2 className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{profile.companyName}</p>
                  <p className="text-xs text-slate-400">{profile.industry}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Size</span>
                  <span className="font-medium text-slate-700">{profile.companySize} employees</span>
                </div>
                <div className="flex justify-between">
                  <span>Recruiter</span>
                  <span className="font-medium text-slate-700">{profile.recruiterTitle}</span>
                </div>
                {profile.website && (
                  <div className="flex justify-between">
                    <span>Website</span>
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium truncate max-w-[120px]"
                    >
                      {profile.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Engine status */}
            <div className="bg-gradient-to-br from-[#0f172a] to-[#1e3060] border border-slate-700 rounded-xl shadow-sm p-5 text-white">
              <div className="flex items-center gap-2 mb-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                  Engine Active
                </p>
              </div>
              <p className="text-lg font-bold mb-0.5">{totalMatched} candidates</p>
              <p className="text-xs text-slate-400">matched to your open roles</p>
              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">
                  Pulse-Ops Engine
                </p>
                <div className="space-y-1.5">
                  {["Skill Confidence Scoring", "Real-time Alerts", "Blind Matching"].map(
                    (f) => (
                      <div key={f} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-xs text-slate-300">{f}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
