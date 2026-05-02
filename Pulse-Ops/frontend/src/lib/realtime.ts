/**
 * realtime.ts — Supabase Realtime subscription helpers
 *
 * Strategy:
 *   - mission_logs  → INSERT subscription (terminal stream, low latency)
 *   - missions       → UPDATE subscription (status badge, HITL trigger)
 *   - pulse_scores   → UPDATE subscription (dashboard score widget)
 *   - notifications  → INSERT subscription (global toast alerts)
 *
 * All subscriptions are channel-scoped and filtered server-side using
 * Supabase's postgres_changes filter syntax so only relevant rows are sent
 * to each client.
 */

import { supabase } from "./supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

// ── Types ──────────────────────────────────────────────────────

export interface MissionLogRow {
  id: number;
  mission_id: string | null;
  user_id: string;
  log_level: "info" | "warn" | "error" | "success";
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface MissionUpdateRow {
  id: string;
  status: string;
  match_score: number | null;
  updated_at: string;
}

export interface PulseScoreRow {
  user_id: string;
  total: number;
  recency: number;
  diversity: number;
  consistency: number;
  sparkline: number[];
  computed_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

// ── 1. Terminal stream: mission_logs for a specific user ────────
/**
 * Use this on the onboarding Sync step and on any page that shows
 * a terminal widget. Receives every new log row for this user as it
 * is written by the backend ingestion/outreach agents.
 *
 * Filters server-side: only rows where user_id = userId are sent.
 */
export function subscribeToSyncLogs(
  userId: string,
  onLog: (row: MissionLogRow) => void
): RealtimeChannel {
  return supabase
    .channel(`sync_logs:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "mission_logs",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => onLog(payload.new as MissionLogRow)
    )
    .subscribe();
}

// ── 2. Mission status updates (dashboard + mission detail) ──────
/**
 * Subscribe to status changes on a specific mission.
 * Powers the badge state machine: tailoring → awaiting_approval → submitted.
 *
 * On the dashboard: subscribe to ALL user's missions by filtering user_id.
 * On mission detail: subscribe to the single mission_id.
 */
export function subscribeToMissionUpdates(
  filter: { userId: string } | { missionId: string },
  onUpdate: (row: MissionUpdateRow) => void
): RealtimeChannel {
  const filterStr =
    "userId" in filter
      ? `user_id=eq.${filter.userId}`
      : `id=eq.${filter.missionId}`;

  const channelName =
    "userId" in filter
      ? `missions:user:${filter.userId}`
      : `missions:single:${filter.missionId}`;

  return supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "missions",
        filter: filterStr,
      },
      (payload) => onUpdate(payload.new as MissionUpdateRow)
    )
    .subscribe();
}

// ── 3. Pulse score updates ───────────────────────────────────────
/**
 * Subscribe to pulse_scores changes for this user.
 * Fires after nightly refresh or after a manual /api/pulse/sync completes.
 * The dashboard score widget and the sparkline chart should re-render on this.
 */
export function subscribeToPulseScore(
  userId: string,
  onUpdate: (row: PulseScoreRow) => void
): RealtimeChannel {
  return supabase
    .channel(`pulse_score:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "pulse_scores",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => onUpdate(payload.new as PulseScoreRow)
    )
    .subscribe();
}

// ── 4. In-app notifications ──────────────────────────────────────
/**
 * Global notification subscription. Fires for any new notification
 * inserted for this user (shortlisted, mission_paused, etc.).
 * The root layout should mount this once and drive a toast/badge.
 */
export function subscribeToNotifications(
  userId: string,
  onNotification: (row: NotificationRow) => void
): RealtimeChannel {
  return supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => onNotification(payload.new as NotificationRow)
    )
    .subscribe();
}

// ── Cleanup helper ───────────────────────────────────────────────
/**
 * Call this in useEffect cleanup or component unmount.
 * Supabase channels must be explicitly removed to avoid memory leaks.
 *
 * Usage in React:
 *   useEffect(() => {
 *     const ch = subscribeToSyncLogs(userId, handler);
 *     return () => { supabase.removeChannel(ch); };
 *   }, [userId]);
 */
export { supabase };
