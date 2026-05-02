"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeft, CheckCircle2, XCircle, Edit3, Send, ShieldAlert, Cpu,
  ExternalLink, AlertTriangle, Database, Loader2, AlertCircle, RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMissionDetail, useMissionAction, useHitlSubmit } from "@/lib/queries";
import type { HITLQuestion } from "@/lib/api";

// ── Status badge ──────────────────────────────────────────────────
const STATUS_BADGE_MAP: Record<string, { label: string; cls: string }> = {
  awaiting_approval: { label: "Action Required",  cls: "bg-amber-50 border-amber-300 text-amber-700 animate-pulse" },
  tailoring:         { label: "Tailoring",         cls: "bg-blue-50 border-blue-300 text-blue-700" },
  scouting:          { label: "Scouting",          cls: "bg-slate-100 border-slate-300 text-slate-600" },
  resuming:          { label: "Agent Resuming…",   cls: "bg-blue-50 border-blue-300 text-blue-700 animate-pulse" },
  submitted:         { label: "Applied",           cls: "bg-emerald-50 border-emerald-300 text-emerald-700" },
  rejected:          { label: "Rejected",          cls: "bg-red-50 border-red-300 text-red-600" },
  withdrawn:         { label: "Withdrawn",         cls: "bg-slate-100 border-slate-300 text-slate-500" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_BADGE_MAP[status] ?? { label: status, cls: "bg-slate-100 border-slate-200 text-slate-600" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-slate-200 rounded animate-pulse ${className}`} />;
}

// ── Page ──────────────────────────────────────────────────────────
export default function MissionDetailPage({ params }: { params: { mission_id: string } }) {
  const router = useRouter();
  const { mission_id } = params;

  // ── Server state (React Query) ────────────────────────────────
  const {
    data: mission,
    isLoading,
    isError,
    error,
    refetch,
  } = useMissionDetail(mission_id);

  const actionMutation = useMissionAction(mission_id);
  const hitlMutation   = useHitlSubmit(mission_id);

  // ── Local UI state only ───────────────────────────────────────
  const [hitlResponses, setHitlResponses] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing]         = useState(false);
  const [editedNarrative, setEditedNarrative] = useState("");

  // Sync narrative textarea when data first arrives
  useEffect(() => {
    if (mission?.narrative_text && !editedNarrative) {
      setEditedNarrative(mission.narrative_text);
    }
  }, [mission?.narrative_text]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── HITL submit ───────────────────────────────────────────────
  const handleHitlSubmit = () => {
    const unanswered = (mission?.hitl_questions as HITLQuestion[] ?? [])
      .filter((q) => !hitlResponses[q.id]?.trim());
    if (unanswered.length) {
      toast.error(`Please answer all ${unanswered.length} required field(s)`);
      return;
    }
    hitlMutation.mutate(hitlResponses);
  };

  // ── Derived ───────────────────────────────────────────────────
  const status      = mission?.status ?? "";
  const canApprove  = ["awaiting_approval", "tailoring"].includes(status);
  const canReject   = ["scouting", "tailoring", "awaiting_approval"].includes(status);
  const canWithdraw = status === "submitted";
  const showHitl    = status === "awaiting_approval" && (mission?.hitl_questions?.length ?? 0) > 0;

  // ── Render ────────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <div
        className="min-h-screen bg-[#f0f2f8] flex flex-col h-screen overflow-hidden"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Header */}
        <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-4 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
            </Button>
            <Separator orientation="vertical" className="h-5 bg-slate-200" />
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Skeleton className="w-28 h-4" />
                <Skeleton className="w-20 h-4" />
              </div>
            ) : mission ? (
              <div className="flex items-center gap-2">
                <span className="text-slate-900 font-semibold text-sm">{mission.job.company}</span>
                <span className="text-slate-300">/</span>
                <span className="text-[#1e3060] text-sm font-medium">{mission.job.title}</span>
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            {mission && (
              <span className="text-xs font-semibold text-slate-500">
                Match: <span className="text-emerald-600">{mission.match_score}%</span>
              </span>
            )}
            {mission && <StatusBadge status={mission.status} />}
          </div>
        </header>

        {/* Error */}
        {isError && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <div>
              <p className="font-semibold text-slate-700 mb-1">Failed to load mission</p>
              <p className="text-sm text-slate-500 mb-4">{(error as Error)?.message}</p>
              <Button
                onClick={() => refetch()}
                className="bg-[#1e3060] hover:bg-[#162448] text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Retry
              </Button>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="flex flex-1 overflow-hidden">
            <div className="w-1/2 border-r border-slate-200 p-8 space-y-4">
              <Skeleton className="w-40 h-6" />
              <Skeleton className="w-full h-24" />
              <Skeleton className="w-3/4 h-4" />
              {[1, 2, 3].map((i) => <Skeleton key={i} className="w-full h-14" />)}
            </div>
            <div className="w-1/2 p-8 space-y-4">
              <Skeleton className="w-40 h-6" />
              <Skeleton className="w-full h-32" />
              <Skeleton className="w-full h-48" />
            </div>
          </div>
        )}

        {/* Main content */}
        {!isLoading && !isError && mission && (
          <div className="flex flex-1 overflow-hidden">

            {/* ── Left: Job Description ─────────────────────── */}
            <div className="w-1/2 border-r border-slate-200 flex flex-col bg-white">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 shrink-0">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  Job Description
                </h3>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-1">{mission.job.title}</h2>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 mb-5">
                    <span>{mission.job.company}</span>
                    {mission.job.domain && (
                      <><span className="text-slate-300">·</span><span>{mission.job.domain}</span></>
                    )}
                    {mission.job.salary_raw && (
                      <><span className="text-slate-300">·</span>
                      <span className="text-emerald-600 font-medium">{mission.job.salary_raw}</span></>
                    )}
                  </div>

                  {mission.job.description && (
                    <p className="text-sm text-slate-600 leading-relaxed mb-6">
                      {mission.job.description}
                    </p>
                  )}

                  {(mission.job.hard_requirements?.length ?? 0) > 0 && (
                    <div className="mb-6">
                      <h3 className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Hard Requirements
                      </h3>
                      <ul className="space-y-2">
                        {mission.job.hard_requirements!.map((req, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="text-slate-700">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(mission.job.soft_requirements?.length ?? 0) > 0 && (
                    <div>
                      <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
                        Nice to Have
                      </h3>
                      <ul className="space-y-2">
                        {mission.job.soft_requirements!.map((req, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm px-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 mt-2" />
                            <span className="text-slate-500">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* ── Right: Narrative + HITL ────────────────────── */}
            <div className="w-1/2 flex flex-col bg-[#f0f2f8]">
              <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center gap-2 shrink-0">
                <Cpu className="w-3.5 h-3.5 text-[#1e3060]" />
                <h3 className="text-xs font-semibold text-[#1e3060] uppercase tracking-widest">
                  Agent Draft
                </h3>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-6 space-y-4">

                  {/* Narrative card */}
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">
                        Justification Narrative
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-slate-700 h-7 px-2 text-xs"
                        onClick={() => setIsEditing((v) => !v)}
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1" />
                        {isEditing ? "Done" : "Edit"}
                      </Button>
                    </div>

                    <div className="p-5 text-sm leading-loose text-slate-700">
                      {isEditing ? (
                        <Textarea
                          className="min-h-[150px] border-slate-200 focus-visible:ring-[#1e3060]/30 text-slate-800 text-sm leading-relaxed"
                          value={editedNarrative}
                          onChange={(e) => setEditedNarrative(e.target.value)}
                        />
                      ) : (
                        <div>
                          {mission.narrative_text && <span>{mission.narrative_text}</span>}

                          {mission.narrative_chips.map((chip) => (
                            <Tooltip key={chip.pulse_entry_id}>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center mx-1 px-2 py-0.5 rounded-md bg-[#1e3060]/10 border border-[#1e3060]/20 text-[#1e3060] cursor-help text-sm font-medium hover:bg-[#1e3060]/15 transition-colors">
                                  {chip.chip_label}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className="w-72 bg-white border-slate-200 p-4 shadow-xl rounded-xl"
                              >
                                <div className="space-y-3">
                                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <Database className="w-3 h-3" /> Pulse Evidence
                                  </div>
                                  <p className="text-sm text-slate-800 font-medium">{chip.raw_metric}</p>
                                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg">
                                    <div className="flex justify-between text-[10px] text-slate-500 mb-1.5 font-medium">
                                      <span>Impact Weight</span>
                                      <span className="text-emerald-600 font-bold">{chip.impact_weight}/10</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-emerald-500 rounded-full"
                                        style={{ width: `${(chip.impact_weight / 10) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                  {chip.proof_url && (
                                    <a
                                      href={chip.proof_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs text-[#1e3060] hover:underline flex items-center gap-1 pt-1"
                                    >
                                      View source <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ))}

                          {!mission.narrative_text && mission.narrative_chips.length === 0 && (
                            <span className="text-slate-400 italic">
                              Narrative not yet generated by agent.
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* HITL */}
                  {showHitl && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl shadow-sm overflow-hidden">
                      <div className="px-5 py-3 border-b border-amber-200 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-amber-800">Manual Input Required</p>
                          <p className="text-xs text-amber-600 mt-0.5">
                            Agent paused — cannot auto-fill these ATS fields.
                          </p>
                        </div>
                      </div>
                      <div className="p-5 space-y-5">
                        {(mission.hitl_questions as HITLQuestion[]).map((q) => (
                          <div key={q.id}>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                              {q.field_label}
                            </label>
                            {q.field_type === "textarea" ? (
                              <Textarea
                                className="border-amber-200 focus-visible:ring-amber-400/30 bg-white text-slate-800 min-h-[80px]"
                                placeholder="Enter your response…"
                                value={hitlResponses[q.id] ?? ""}
                                onChange={(e) =>
                                  setHitlResponses((p) => ({ ...p, [q.id]: e.target.value }))
                                }
                              />
                            ) : (
                              <Input
                                className="border-amber-200 focus-visible:ring-amber-400/30 bg-white text-slate-800 h-10"
                                placeholder="Enter value…"
                                value={hitlResponses[q.id] ?? ""}
                                onChange={(e) =>
                                  setHitlResponses((p) => ({ ...p, [q.id]: e.target.value }))
                                }
                              />
                            )}
                          </div>
                        ))}
                        <Button
                          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-sm"
                          onClick={handleHitlSubmit}
                          disabled={hitlMutation.isPending}
                        >
                          {hitlMutation.isPending ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…</>
                          ) : (
                            <><Send className="w-4 h-4 mr-2" /> Submit & Resume Agent</>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Action bar */}
              <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  {canReject && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                      disabled={actionMutation.isPending}
                      onClick={() => actionMutation.mutate("reject")}
                    >
                      {actionMutation.isPending && actionMutation.variables === "reject" ? (
                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-1.5" />
                      )}
                      Reject
                    </Button>
                  )}
                  {canWithdraw && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-200 text-slate-600 hover:bg-slate-100"
                      disabled={actionMutation.isPending}
                      onClick={() => actionMutation.mutate("withdraw")}
                    >
                      {actionMutation.isPending && actionMutation.variables === "withdraw" ? (
                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-1.5" />
                      )}
                      Withdraw
                    </Button>
                  )}
                </div>

                {canApprove && (
                  <Button
                    className="bg-[#1e3060] hover:bg-[#162448] text-white font-semibold px-6 shadow-sm"
                    disabled={actionMutation.isPending}
                    onClick={() => actionMutation.mutate("approve")}
                  >
                    {actionMutation.isPending && actionMutation.variables === "approve" ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Approving…</>
                    ) : (
                      <><CheckCircle2 className="w-4 h-4 mr-2" /> Approve & Submit</>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
