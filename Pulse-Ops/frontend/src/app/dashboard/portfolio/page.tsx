"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Video, Briefcase, BookOpen, Trophy, Plus, X, Save, Loader2,
  ExternalLink, ChevronDown, ChevronUp, Award, CheckCircle2, Globe,
  Zap, Star, ArrowLeft,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────
type Project = { id?: string; title: string; role_in_project: string; description: string; impact_metric: string; tech_tags: string[]; project_url: string; is_featured: boolean };
type CaseStudy = { id?: string; title: string; problem: string; approach: string; outcome: string; impact_metric: string; tags: string[] };
type AwardItem = { id?: string; title: string; issuer: string; award_year: string; award_type: string; description: string; credential_url: string };

const EMPTY_PROJECT: Project = { title: "", role_in_project: "", description: "", impact_metric: "", tech_tags: [], project_url: "", is_featured: false };
const EMPTY_CASE: CaseStudy = { title: "", problem: "", approach: "", outcome: "", impact_metric: "", tags: [] };
const EMPTY_AWARD: AwardItem = { title: "", issuer: "", award_year: "", award_type: "award", description: "", credential_url: "" };

// ─── Tag Input ────────────────────────────────────────────────────────────────
function TagInput({ tags, onChange, placeholder }: { tags: string[]; onChange: (t: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState("");
  const add = () => { const t = input.trim(); if (t && !tags.includes(t)) onChange([...tags, t]); setInput(""); };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map(tag => (
          <span key={tag} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-medium">
            {tag}
            <button type="button" onClick={() => onChange(tags.filter(t => t !== tag))} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder} className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400" />
        <button type="button" onClick={add} className="px-3 h-9 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold transition-colors">Add</button>
      </div>
    </div>
  );
}

// ─── Section shell ────────────────────────────────────────────────────────────
function Section({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#1e3060]/10 rounded-xl flex items-center justify-center text-[#1e3060]">{icon}</div>
          <div><h2 className="font-bold text-slate-900">{title}</h2><p className="text-xs text-slate-500 mt-0.5">{subtitle}</p></div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}{hint && <span className="text-xs font-normal text-slate-400 ml-2">{hint}</span>}</label>
      {children}
    </div>
  );
}

const INPUT = "w-full h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e3060]/30 focus:border-[#1e3060] transition-all";
const TEXTAREA = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-[#1e3060]/30 focus:border-[#1e3060] transition-all";

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PortfolioPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ── Profile intro
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [location, setLocation] = useState("");
  const [availability, setAvailability] = useState("open");

  // ── Projects
  const [projects, setProjects] = useState<Project[]>([]);
  const [expandedProject, setExpandedProject] = useState<number | null>(0);

  // ── Case studies
  const [cases, setCases] = useState<CaseStudy[]>([]);
  const [expandedCase, setExpandedCase] = useState<number | null>(0);

  // ── Awards
  const [awards, setAwards] = useState<AwardItem[]>([]);
  const [expandedAward, setExpandedAward] = useState<number | null>(0);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [{ data: cp }, { data: projs }, { data: css }, { data: aws }] = await Promise.all([
        supabase.from("candidate_profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("candidate_projects").select("*").eq("user_id", user.id).order("display_order"),
        supabase.from("candidate_case_studies").select("*").eq("user_id", user.id).order("display_order"),
        supabase.from("candidate_awards").select("*").eq("user_id", user.id).order("display_order"),
      ]);

      if (cp) { setHeadline((cp as any).headline ?? ""); setBio((cp as any).bio ?? ""); setVideoUrl((cp as any).video_url ?? ""); setLocation((cp as any).location ?? ""); setAvailability((cp as any).availability ?? "open"); }
      if (projs?.length) setProjects((projs as any[]).map(p => ({ id: p.id, title: p.title, role_in_project: p.role_in_project ?? "", description: p.description ?? "", impact_metric: p.impact_metric ?? "", tech_tags: p.tech_tags ?? [], project_url: p.project_url ?? "", is_featured: p.is_featured ?? false })));
      if (css?.length) setCases((css as any[]).map(c => ({ id: c.id, title: c.title, problem: c.problem ?? "", approach: c.approach ?? "", outcome: c.outcome ?? "", impact_metric: c.impact_metric ?? "", tags: c.tags ?? [] })));
      if (aws?.length) setAwards((aws as any[]).map(a => ({ id: a.id, title: a.title, issuer: a.issuer ?? "", award_year: String(a.award_year ?? ""), award_type: a.award_type ?? "award", description: a.description ?? "", credential_url: a.credential_url ?? "" })));
    };
    load();
  }, []);

  const handleSave = useCallback(async () => {
    if (!userId) { toast.error("Please sign in first."); return; }
    setSaving(true);
    try {
      // Upsert candidate_profiles
      const { error: cpErr } = await supabase.from("candidate_profiles").upsert({
        user_id: userId, headline, bio, video_url: videoUrl, location, availability,
      }, { onConflict: "user_id" });
      if (cpErr) throw cpErr;

      // Upsert projects
      for (const [i, p] of projects.entries()) {
        if (!p.title.trim()) continue;
        await supabase.from("candidate_projects").upsert({
          ...(p.id ? { id: p.id } : {}), user_id: userId, title: p.title, role_in_project: p.role_in_project,
          description: p.description, impact_metric: p.impact_metric, tech_tags: p.tech_tags,
          project_url: p.project_url, is_featured: p.is_featured, display_order: i,
        }, { onConflict: "id" });
      }

      // Upsert case studies
      for (const [i, c] of cases.entries()) {
        if (!c.title.trim()) continue;
        await supabase.from("candidate_case_studies").upsert({
          ...(c.id ? { id: c.id } : {}), user_id: userId, title: c.title, problem: c.problem,
          approach: c.approach, outcome: c.outcome, impact_metric: c.impact_metric, tags: c.tags, display_order: i,
        }, { onConflict: "id" });
      }

      // Upsert awards
      for (const [i, a] of awards.entries()) {
        if (!a.title.trim()) continue;
        await supabase.from("candidate_awards").upsert({
          ...(a.id ? { id: a.id } : {}), user_id: userId, title: a.title, issuer: a.issuer,
          award_year: a.award_year ? parseInt(a.award_year) : null, award_type: a.award_type,
          description: a.description, credential_url: a.credential_url, display_order: i,
        }, { onConflict: "id" });
      }

      toast.success("Portfolio saved!", { description: "Recruiters can now see your full profile." });
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  }, [userId, headline, bio, videoUrl, location, availability, projects, cases, awards]);

  const updateProject = (i: number, patch: Partial<Project>) => setProjects(ps => ps.map((p, idx) => idx === i ? { ...p, ...patch } : p));
  const updateCase = (i: number, patch: Partial<CaseStudy>) => setCases(cs => cs.map((c, idx) => idx === i ? { ...c, ...patch } : c));
  const updateAward = (i: number, patch: Partial<AwardItem>) => setAwards(as => as.map((a, idx) => idx === i ? { ...a, ...patch } : a));

  // YouTube preview
  const ytId = videoUrl.match(/(?:embed\/|v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
  const loomId = videoUrl.includes("loom.com/share/") ? videoUrl.split("loom.com/share/")[1]?.split("?")[0] : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-semibold text-slate-900">My Portfolio</span>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1e3060] hover:bg-[#162448] text-white rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-70">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Portfolio"}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Intro banner */}
        <div className="bg-gradient-to-r from-[#1e3060] to-[#2a4080] rounded-2xl p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0"><Star className="w-5 h-5" /></div>
            <div>
              <h1 className="text-xl font-black">Your Career Showcase</h1>
              <p className="text-blue-200 text-sm mt-1.5">This is what recruiters see when they view your profile. Fill in your intro video, projects, case studies, and achievements to stand out from the crowd.</p>
            </div>
          </div>
        </div>

        {/* ── Intro & Bio ── */}
        <Section icon={<Globe className="w-5 h-5" />} title="Profile Basics" subtitle="Your headline, bio, and availability shown at the top of your profile">
          <div className="space-y-4">
            <Field label="Professional Headline" hint="e.g. Senior Product Manager | Ex-Stripe, Notion">
              <input value={headline} onChange={e => setHeadline(e.target.value)} placeholder="Your current title and standout credentials" className={INPUT} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Location">
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Mumbai, India" className={INPUT} />
              </Field>
              <Field label="Availability">
                <select value={availability} onChange={e => setAvailability(e.target.value)} className={INPUT}>
                  <option value="open">Open to work — immediately</option>
                  <option value="2_weeks">Available in 2 weeks</option>
                  <option value="1_month">Available in 1 month</option>
                  <option value="not_looking">Not actively looking</option>
                </select>
              </Field>
            </div>
            <Field label="Bio" hint="2–4 sentences about who you are and what drives you">
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} placeholder="Write a compelling summary of your career, strengths, and what you're looking for next..." className={TEXTAREA} />
            </Field>
          </div>
        </Section>

        {/* ── Intro Video ── */}
        <Section icon={<Video className="w-5 h-5" />} title="Introduction Video" subtitle="A 1–2 minute Loom or YouTube video that lets recruiters see your personality">
          <div className="space-y-4">
            <Field label="Video URL" hint="YouTube or Loom link">
              <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://loom.com/share/... or https://youtu.be/..." className={INPUT} />
            </Field>
            {(ytId || loomId) && (
              <div className="rounded-xl overflow-hidden aspect-video bg-slate-900">
                {ytId && <iframe src={`https://www.youtube.com/embed/${ytId}`} className="w-full h-full" allowFullScreen title="Intro video preview" />}
                {loomId && <iframe src={`https://www.loom.com/embed/${loomId}`} className="w-full h-full" allowFullScreen title="Loom video preview" />}
              </div>
            )}
            {videoUrl && !ytId && !loomId && (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <ExternalLink className="w-4 h-4 text-slate-400" />
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-700 truncate">{videoUrl}</p><p className="text-xs text-slate-400">Recruiters will see a Watch Video button</p></div>
              </div>
            )}
            {!videoUrl && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
                <span className="font-semibold">Pro tip:</span> Candidates with intro videos get 3× more recruiter engagement. Keep it under 2 minutes and speak to your top achievement.
              </div>
            )}
          </div>
        </Section>

        {/* ── Projects ── */}
        <Section icon={<Briefcase className="w-5 h-5" />} title="Projects" subtitle={`Showcase your best work — up to 5 projects (${projects.length}/5 added)`}>
          <div className="space-y-3">
            {projects.map((proj, i) => (
              <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
                <button onClick={() => setExpandedProject(expandedProject === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    {proj.is_featured && <Star className="w-3.5 h-3.5 text-amber-500" />}
                    <span className="font-semibold text-slate-800 text-sm">{proj.title || `Project ${i + 1}`}</span>
                    {proj.role_in_project && <span className="text-xs text-slate-400">· {proj.role_in_project}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={e => { e.stopPropagation(); setProjects(ps => ps.filter((_, idx) => idx !== i)); }} className="text-slate-300 hover:text-red-500 transition-colors p-1"><X className="w-3.5 h-3.5" /></button>
                    {expandedProject === i ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>
                {expandedProject === i && (
                  <div className="p-5 space-y-4 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Project Title *"><input value={proj.title} onChange={e => updateProject(i, { title: e.target.value })} placeholder="e.g. Customer Churn Prediction System" className={INPUT} /></Field>
                      <Field label="Your Role"><input value={proj.role_in_project} onChange={e => updateProject(i, { role_in_project: e.target.value })} placeholder="e.g. Lead Data Scientist" className={INPUT} /></Field>
                    </div>
                    <Field label="Description" hint="What did you build, and why?">
                      <textarea value={proj.description} onChange={e => updateProject(i, { description: e.target.value })} rows={3} placeholder="Describe the project scope, your decisions, and the problem it solved..." className={TEXTAREA} />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Impact / Outcome" hint="Quantify it"><input value={proj.impact_metric} onChange={e => updateProject(i, { impact_metric: e.target.value })} placeholder="e.g. Reduced churn by 23%" className={INPUT} /></Field>
                      <Field label="Project URL"><input value={proj.project_url} onChange={e => updateProject(i, { project_url: e.target.value })} placeholder="https://..." className={INPUT} /></Field>
                    </div>
                    <Field label="Tech / Skills Used"><TagInput tags={proj.tech_tags} onChange={tags => updateProject(i, { tech_tags: tags })} placeholder="Type a skill and press Add" /></Field>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" checked={proj.is_featured} onChange={e => updateProject(i, { is_featured: e.target.checked })} className="w-4 h-4 rounded accent-blue-600" />
                      <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-amber-500" />Feature this project at the top</span>
                    </label>
                  </div>
                )}
              </div>
            ))}
            {projects.length < 5 && (
              <button onClick={() => { setProjects(ps => [...ps, { ...EMPTY_PROJECT }]); setExpandedProject(projects.length); }}
                className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-slate-200 hover:border-[#1e3060] text-slate-400 hover:text-[#1e3060] rounded-xl text-sm font-semibold transition-all">
                <Plus className="w-4 h-4" /> Add Project
              </button>
            )}
          </div>
        </Section>

        {/* ── Case Studies ── */}
        <Section icon={<BookOpen className="w-5 h-5" />} title="Case Studies" subtitle="Structured problem → approach → outcome stories that show how you think">
          <div className="space-y-3">
            {cases.map((cs, i) => (
              <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
                <button onClick={() => setExpandedCase(expandedCase === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left">
                  <span className="font-semibold text-slate-800 text-sm">{cs.title || `Case Study ${i + 1}`}</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={e => { e.stopPropagation(); setCases(prev => prev.filter((_, idx) => idx !== i)); }} className="text-slate-300 hover:text-red-500 p-1"><X className="w-3.5 h-3.5" /></button>
                    {expandedCase === i ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>
                {expandedCase === i && (
                  <div className="p-5 space-y-4 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Title *"><input value={cs.title} onChange={e => updateCase(i, { title: e.target.value })} placeholder="e.g. Reducing Last-Mile Failures by 85%" className={INPUT} /></Field>
                      <Field label="Impact Metric"><input value={cs.impact_metric} onChange={e => updateCase(i, { impact_metric: e.target.value })} placeholder="e.g. -85% failure rate" className={INPUT} /></Field>
                    </div>
                    <Field label="The Problem"><textarea value={cs.problem} onChange={e => updateCase(i, { problem: e.target.value })} rows={2} placeholder="What was the specific problem? What was the business impact?" className={TEXTAREA} /></Field>
                    <Field label="My Approach"><textarea value={cs.approach} onChange={e => updateCase(i, { approach: e.target.value })} rows={3} placeholder="How did you diagnose the problem? What did you try? What decisions did you make and why?" className={TEXTAREA} /></Field>
                    <Field label="The Outcome"><textarea value={cs.outcome} onChange={e => updateCase(i, { outcome: e.target.value })} rows={2} placeholder="What was the measurable result? How did it change the business?" className={TEXTAREA} /></Field>
                    <Field label="Tags"><TagInput tags={cs.tags} onChange={tags => updateCase(i, { tags })} placeholder="e.g. Growth, Operations, Product" /></Field>
                  </div>
                )}
              </div>
            ))}
            {cases.length < 5 && (
              <button onClick={() => { setCases(prev => [...prev, { ...EMPTY_CASE }]); setExpandedCase(cases.length); }}
                className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-slate-200 hover:border-[#1e3060] text-slate-400 hover:text-[#1e3060] rounded-xl text-sm font-semibold transition-all">
                <Plus className="w-4 h-4" /> Add Case Study
              </button>
            )}
          </div>
        </Section>

        {/* ── Awards ── */}
        <Section icon={<Trophy className="w-5 h-5" />} title="Awards & Certifications" subtitle="Professional awards, industry recognitions, and verified credentials">
          <div className="space-y-3">
            {awards.map((award, i) => (
              <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
                <button onClick={() => setExpandedAward(expandedAward === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${award.award_type === "certification" ? "bg-blue-50 text-blue-700" : award.award_type === "award" ? "bg-amber-50 text-amber-700" : "bg-purple-50 text-purple-700"}`}>{award.award_type}</span>
                    <span className="font-semibold text-slate-800 text-sm">{award.title || `Achievement ${i + 1}`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={e => { e.stopPropagation(); setAwards(prev => prev.filter((_, idx) => idx !== i)); }} className="text-slate-300 hover:text-red-500 p-1"><X className="w-3.5 h-3.5" /></button>
                    {expandedAward === i ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>
                {expandedAward === i && (
                  <div className="p-5 space-y-4 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Title *"><input value={award.title} onChange={e => updateAward(i, { title: e.target.value })} placeholder="e.g. AWS Certified Solutions Architect" className={INPUT} /></Field>
                      <Field label="Type">
                        <select value={award.award_type} onChange={e => updateAward(i, { award_type: e.target.value })} className={INPUT}>
                          <option value="award">Award</option>
                          <option value="certification">Certification</option>
                          <option value="recognition">Recognition</option>
                          <option value="publication">Publication</option>
                        </select>
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Issuer"><input value={award.issuer} onChange={e => updateAward(i, { issuer: e.target.value })} placeholder="e.g. Amazon Web Services" className={INPUT} /></Field>
                      <Field label="Year"><input type="number" value={award.award_year} onChange={e => updateAward(i, { award_year: e.target.value })} placeholder="2024" min="1990" max="2030" className={INPUT} /></Field>
                    </div>
                    <Field label="Description" hint="optional"><textarea value={award.description} onChange={e => updateAward(i, { description: e.target.value })} rows={2} placeholder="Brief context about why you received this..." className={TEXTAREA} /></Field>
                    <Field label="Credential URL" hint="optional"><input value={award.credential_url} onChange={e => updateAward(i, { credential_url: e.target.value })} placeholder="https://..." className={INPUT} /></Field>
                  </div>
                )}
              </div>
            ))}
            <button onClick={() => { setAwards(prev => [...prev, { ...EMPTY_AWARD }]); setExpandedAward(awards.length); }}
              className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-slate-200 hover:border-[#1e3060] text-slate-400 hover:text-[#1e3060] rounded-xl text-sm font-semibold transition-all">
              <Plus className="w-4 h-4" /> Add Award or Certification
            </button>
          </div>
        </Section>

        {/* Save CTA */}
        <div className="bg-gradient-to-r from-[#1e3060] to-[#2a4080] rounded-2xl p-6 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 text-white">
            <Zap className="w-5 h-5 text-blue-300 shrink-0" />
            <div><p className="font-bold">Ready to impress recruiters?</p><p className="text-sm text-blue-200 mt-0.5">Save your portfolio — it goes live instantly for matched recruiters to see.</p></div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="shrink-0 flex items-center gap-2 px-6 py-3 bg-white text-[#1e3060] rounded-xl font-bold text-sm shadow-md hover:bg-blue-50 transition-colors disabled:opacity-70">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Portfolio"}
          </button>
        </div>
      </div>
    </div>
  );
}
