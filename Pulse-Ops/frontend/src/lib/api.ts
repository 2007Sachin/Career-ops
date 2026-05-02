import { supabase } from "./supabase";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

if (!process.env.NEXT_PUBLIC_API_URL && process.env.NODE_ENV === "production") {
  console.error("NEXT_PUBLIC_API_URL is not set — falling back to localhost");
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  signal?: AbortSignal,
): Promise<T> {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    signal,
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Typed helpers ─────────────────────────────────────────────────

export type MissionSummary = {
  id: string;
  job_id: string;
  company: string;
  role: string;
  match_score: number;
  status: string;
};

export type NarrativeChip = {
  chip_label: string;
  pulse_entry_id: string;
  proof_url: string | null;
  raw_metric: string;
  impact_weight: number;
};

export type HITLQuestion = {
  id: string;
  field_label: string;
  field_type: string;
  display_order: number;
};

export type MissionDetail = {
  id: string;
  job: {
    id: string;
    title: string;
    company: string;
    domain: string;
    salary_raw: string | null;
    description: string | null;
    hard_requirements: string[] | null;
    soft_requirements: string[] | null;
  };
  status: string;
  match_score: number;
  narrative_text: string | null;
  narrative_chips: NarrativeChip[];
  hitl_questions: HITLQuestion[];
};

export type PulseScore = {
  user_id: string;
  total: number;
  recency: number;
  diversity: number;
  consistency: number;
  sparkline: number[];
  skill_scores: Record<string, number>;
  computed_at: string;
};

export type CreateMissionPayload = {
  job_title: string;
  company: string;
  match_score?: number;
  job_url?: string;
};

export const missionsApi = {
  list: (signal?: AbortSignal) =>
    apiFetch<MissionSummary[]>("/api/missions", {}, signal),

  get: (id: string, signal?: AbortSignal) =>
    apiFetch<MissionDetail>(`/api/missions/${id}`, {}, signal),

  create: (data: CreateMissionPayload) =>
    apiFetch<{ id: string }>("/api/missions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  submitHitl: (id: string, responses: Record<string, string>) =>
    apiFetch<void>(`/api/missions/${id}/hitl`, {
      method: "POST",
      body: JSON.stringify({ responses }),
    }),

  action: (id: string, action: "approve" | "reject" | "withdraw") =>
    apiFetch<void>(`/api/missions/${id}/action`, {
      method: "POST",
      body: JSON.stringify({ action }),
    }),
};

export const pulseApi = {
  getScore: (userId: string, signal?: AbortSignal) =>
    apiFetch<PulseScore>(`/api/pulse/${userId}`, {}, signal),
};
