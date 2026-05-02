"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, SlidersHorizontal, Lock, LockOpen, FileText, UserCheck, Star, Play } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const initialCandidates = [
  { id: "c1", name: "Candidate A.", hiddenName: "Arjun Mehta", email: "arjun.mehta@example.com", unlocked: false, shortlisted: false, passed: false, roleMatchScore: 92, skills: ["FastAPI", "Kafka", "PostgreSQL"], lastActive: "2 hrs ago" },
  { id: "c2", name: "Sarah Jenkins", hiddenName: "Sarah Jenkins", email: "sarah.jenkins@example.com", unlocked: true, shortlisted: false, passed: false, roleMatchScore: 88, skills: ["Python", "AWS", "Docker"], lastActive: "1 day ago" },
  { id: "c3", name: "Candidate X.", hiddenName: "Rohan Sharma", email: "rohan.sharma@example.com", unlocked: false, shortlisted: false, passed: false, roleMatchScore: 84, skills: ["FastAPI", "React", "TypeScript"], lastActive: "3 days ago" },
  { id: "c4", name: "Candidate Y.", hiddenName: "Priya Nair", email: "priya.nair@example.com", unlocked: false, shortlisted: false, passed: false, roleMatchScore: 75, skills: ["Node.js", "Redis", "PostgreSQL"], lastActive: "1 week ago" },
];

const mockAuditDetails: Record<string, { github: string; skills: { name: string; confidence: number; entries: { metric: string; url: string; impact: number; date: string }[] }[] }> = {
  c1: {
    github: "https://github.com/hidden",
    skills: [
      { name: "FastAPI", confidence: 95, entries: [
        { metric: "Architected high-throughput microservice handling 5k RPS", url: "#", impact: 9, date: "Mar 12, 2026" },
        { metric: "Merged PR adding async database pooling", url: "#", impact: 7, date: "Feb 28, 2026" },
        { metric: "Solved LeetCode Hard: Distributed Rate Limiter", url: "#", impact: 8, date: "Jan 15, 2026" },
      ]},
      { name: "PostgreSQL", confidence: 88, entries: [
        { metric: "Supabase Schema: Created 14 tables with complex RLS", url: "#", impact: 8, date: "Apr 02, 2026" },
        { metric: "Optimized complex analytical queries reducing latency by 40%", url: "#", impact: 7, date: "Feb 10, 2026" },
      ]},
    ],
  },
  c2: {
    github: "https://github.com/sarah-jenkins",
    skills: [
      { name: "Python", confidence: 92, entries: [
        { metric: "Built ML pipeline reducing inference time by 60%", url: "#", impact: 9, date: "Apr 10, 2026" },
        { metric: "Contributed to OSS pandas with 3 merged PRs", url: "#", impact: 7, date: "Mar 05, 2026" },
      ]},
      { name: "AWS", confidence: 85, entries: [
        { metric: "Architected multi-region ECS deployment", url: "#", impact: 8, date: "Feb 20, 2026" },
      ]},
    ],
  },
  c3: {
    github: "https://github.com/hidden",
    skills: [
      { name: "FastAPI", confidence: 90, entries: [
        { metric: "Built REST API with OAuth2 and JWT auth", url: "#", impact: 8, date: "Apr 01, 2026" },
      ]},
      { name: "React", confidence: 82, entries: [
        { metric: "Developed component library used by 5 teams", url: "#", impact: 7, date: "Mar 15, 2026" },
      ]},
    ],
  },
  c4: {
    github: "https://github.com/hidden",
    skills: [
      { name: "Node.js", confidence: 80, entries: [
        { metric: "Built real-time chat system handling 10k concurrent users", url: "#", impact: 8, date: "Mar 28, 2026" },
      ]},
      { name: "Redis", confidence: 75, entries: [
        { metric: "Implemented distributed caching layer reducing DB load by 70%", url: "#", impact: 7, date: "Feb 14, 2026" },
      ]},
    ],
  },
};

export default function RecruiterFeed() {
  const router = useRouter();
  type Candidate = (typeof initialCandidates)[number];
  const [candidates, setCandidates] = useState(initialCandidates);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const channel = supabase.channel("recruiter_feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "pulse_entries" }, (payload) => {
        const newScore = Math.floor(Math.random() * 20) + 80;
        if (newScore > 80) {
          toast.success("New high-match candidate discovered!", {
            description: `Candidate matched with score: ${newScore}%`,
            duration: 5000,
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleOpenAudit = useCallback((candidate: (typeof initialCandidates)[number]) => {
    router.push(`/recruiter/candidates/${candidate.id}`);
  }, [router]);

  const handleShortlistAndUnlock = async (candidate: Candidate) => {
    setCandidates((prev) =>
      prev.map((c) => c.id === candidate.id ? { ...c, unlocked: true, shortlisted: true } : c)
    );
    toast.success(`${candidate.hiddenName} shortlisted!`, {
      description: `Contact unlocked: ${candidate.email}`,
      duration: 6000,
      action: { label: "Copy Email", onClick: () => navigator.clipboard.writeText(candidate.email) },
    });
  };


  const handleQuickShortlist = (candidate: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (candidate.shortlisted) {
      toast.info("Already shortlisted.");
      return;
    }
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidate.id ? { ...c, shortlisted: true, unlocked: true } : c))
    );
    toast.success(`${candidate.name} shortlisted!`, { description: "Candidate moved to shortlist." });
  };

  const filteredCandidates = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return candidates.filter((c) => {
      if (c.passed) return false;
      return !q || c.name.toLowerCase().includes(q) || c.skills.some((s) => s.toLowerCase().includes(q));
    });
  }, [candidates, searchQuery]);

  return (
    <div className="flex-1 flex flex-col p-8 bg-slate-50 h-[calc(100vh-64px)] overflow-hidden">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Verified Talent Feed</h1>
          <p className="text-slate-500 mt-1">
            Showing matches for <span className="font-semibold text-slate-700">"Senior Backend Engineer"</span> schema.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9 w-64 bg-white border-slate-200 h-9 text-sm"
              placeholder="Search skills, candidates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" className="bg-white border-slate-200 text-slate-600 h-9" onClick={() => toast.info("Filters coming soon.")}>
            <SlidersHorizontal className="w-4 h-4 mr-2" /> Filters
          </Button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <ScrollArea className="flex-1">
          <Table>
            <TableHeader className="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-sm border-b border-slate-200">
              <TableRow>
                <TableHead className="font-semibold text-slate-700">Candidate</TableHead>
                <TableHead className="font-semibold text-slate-700">Role Match Score</TableHead>
                <TableHead className="font-semibold text-slate-700">Top Verified Skills</TableHead>
                <TableHead className="font-semibold text-slate-700">Last Active</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCandidates.map((c) => (
                <TableRow key={c.id} className={`hover:bg-blue-50/30 transition-colors ${c.shortlisted ? "bg-emerald-50/40" : ""}`}>
                  <TableCell className="font-medium text-slate-900 py-4">
                    <div className="flex items-center gap-2">
                      {c.unlocked ? (
                        <LockOpen className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>{c.unlocked ? c.hiddenName : `${c.name} (Hidden)`}</span>
                      {c.shortlisted && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] h-4 px-1.5">
                          <Star className="w-2.5 h-2.5 mr-0.5" /> Shortlisted
                        </Badge>
                      )}
                    </div>
                    {c.unlocked && (
                      <div className="text-xs text-slate-400 mt-0.5 ml-5">{c.email}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border ${c.roleMatchScore >= 90 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : c.roleMatchScore >= 80 ? "bg-blue-50 border-blue-100 text-blue-700" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                        {c.roleMatchScore}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5 flex-wrap">
                      {c.skills.map((s) => (
                        <Badge key={s} variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200 font-medium">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">{c.lastActive}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white border-slate-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all shadow-sm"
                        onClick={() => handleOpenAudit(c)}
                      >
                        <Play className="w-3.5 h-3.5 mr-1.5" /> View Full Profile
                      </Button>
                      {!c.shortlisted && (
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                          onClick={(e) => handleQuickShortlist(c, e)}
                        >
                          <UserCheck className="w-4 h-4 mr-1" /> Shortlist
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCandidates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                    No candidates match your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

    </div>
  );
}
