"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { missionsApi, pulseApi, type MissionSummary, type MissionDetail, type CreateMissionPayload } from "./api";

// ── Query key factory ─────────────────────────────────────────────
// Centralised so cache invalidation and reads always use the same keys.
export const qk = {
  missions: {
    all:    () => ["missions"] as const,
    list:   () => ["missions", "list"] as const,
    detail: (id: string) => ["missions", "detail", id] as const,
  },
  pulse: {
    score: (userId: string) => ["pulse", "score", userId] as const,
  },
} as const;

// ── Missions list ─────────────────────────────────────────────────
export function useMissionsList(
  opts?: Partial<UseQueryOptions<MissionSummary[]>>,
) {
  return useQuery<MissionSummary[]>({
    queryKey: qk.missions.list(),
    queryFn: ({ signal }) => missionsApi.list(signal),
    staleTime: 30_000,
    ...opts,
  });
}

// ── Mission detail ─────────────────────────────────────────────────
export function useMissionDetail(
  id: string,
  opts?: Partial<UseQueryOptions<MissionDetail>>,
) {
  return useQuery<MissionDetail>({
    queryKey: qk.missions.detail(id),
    queryFn: ({ signal }) => missionsApi.get(id, signal),
    staleTime: 10_000,
    enabled: !!id,
    ...opts,
  });
}

// ── Mission action (approve / reject / withdraw) ──────────────────
// Optimistic: updates both the detail cache and the list cache immediately,
// then rolls back on error and refetches on settle.
export function useMissionAction(missionId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (action: "approve" | "reject" | "withdraw") =>
      missionsApi.action(missionId, action),

    onMutate: async (action) => {
      // Stop any in-flight queries from overwriting our optimistic value
      await qc.cancelQueries({ queryKey: qk.missions.detail(missionId) });
      await qc.cancelQueries({ queryKey: qk.missions.list() });

      const prevDetail = qc.getQueryData<MissionDetail>(qk.missions.detail(missionId));
      const prevList   = qc.getQueryData<MissionSummary[]>(qk.missions.list());

      const statusMap = { approve: "resuming", reject: "rejected", withdraw: "withdrawn" } as const;
      const newStatus = statusMap[action];

      qc.setQueryData<MissionDetail>(qk.missions.detail(missionId), (old) =>
        old ? { ...old, status: newStatus } : old,
      );
      qc.setQueryData<MissionSummary[]>(qk.missions.list(), (old) =>
        old?.map((m) => (m.id === missionId ? { ...m, status: newStatus } : m)),
      );

      return { prevDetail, prevList };
    },

    onError: (err, _action, ctx) => {
      // Roll back both caches
      if (ctx?.prevDetail) qc.setQueryData(qk.missions.detail(missionId), ctx.prevDetail);
      if (ctx?.prevList)   qc.setQueryData(qk.missions.list(), ctx.prevList);
      toast.error((err as Error).message ?? "Action failed");
    },

    onSuccess: (_data, action) => {
      const labels = { approve: "approved", reject: "rejected", withdraw: "withdrawn" } as const;
      toast.success(`Mission ${labels[action]}`);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.missions.detail(missionId) });
      qc.invalidateQueries({ queryKey: qk.missions.list() });
    },
  });
}

// ── HITL submit ───────────────────────────────────────────────────
// Optimistic: immediately transitions status to "resuming".
export function useHitlSubmit(missionId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (responses: Record<string, string>) =>
      missionsApi.submitHitl(missionId, responses),

    onMutate: async () => {
      await qc.cancelQueries({ queryKey: qk.missions.detail(missionId) });
      const prev = qc.getQueryData<MissionDetail>(qk.missions.detail(missionId));

      qc.setQueryData<MissionDetail>(qk.missions.detail(missionId), (old) =>
        old ? { ...old, status: "resuming" } : old,
      );

      return { prev };
    },

    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.missions.detail(missionId), ctx.prev);
      toast.error((err as Error).message ?? "Failed to submit responses");
    },

    onSuccess: () => {
      toast.success("Responses submitted — agent is resuming");
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.missions.detail(missionId) });
      qc.invalidateQueries({ queryKey: qk.missions.list() });
    },
  });
}

// ── Create mission (launch agent for a job) ───────────────────────
export function useCreateMission() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMissionPayload) => missionsApi.create(data),

    onSuccess: (_data) => {
      toast.success("Agent launched — check Applications tab");
      qc.invalidateQueries({ queryKey: qk.missions.list() });
    },

    onError: (err) => {
      toast.error((err as Error).message ?? "Failed to launch agent");
    },
  });
}

// ── Pulse score ───────────────────────────────────────────────────
export function usePulseScore(userId: string | null) {
  return useQuery({
    queryKey: qk.pulse.score(userId ?? ""),
    queryFn: ({ signal }) => pulseApi.getScore(userId!, signal),
    staleTime: 5 * 60_000,   // scores are expensive to compute; cache 5 min
    enabled: !!userId,
  });
}
