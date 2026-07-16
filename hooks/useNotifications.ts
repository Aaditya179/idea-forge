"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface NotificationItem {
  id: string;
  complaintId: string;
  complaintTitle: string; // category or truncated raw_text
  note: string;
  statusAtTime: string;
  createdAt: string;
}

interface UseNotificationsReturn {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  markAllSeen: () => void;
}

// ──────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────

const STORAGE_KEY = "civicpulse_notif_last_seen";
const POLL_INTERVAL_MS = 60_000; // 60 seconds
const MAX_NOTIFICATIONS = 20;

// ──────────────────────────────────────────────────────────────
// Helper: read / write localStorage safely (SSR-safe)
// ──────────────────────────────────────────────────────────────

function getLastSeen(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

function setLastSeen(iso: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, iso);
}

// ──────────────────────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────────────────────

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const supabaseRef = useRef(createClient());

  // ── Fetch recent complaint_updates with joined complaint data ──
  const fetchNotifications = useCallback(async () => {
    const supabase = supabaseRef.current;

    // RLS ensures only the citizen's own complaint updates are returned.
    // We join complaint_updates → complaints to get category / raw_text.
    const { data, error } = await supabase
      .from("complaint_updates")
      .select(
        "id, complaint_id, note, status_at_time, created_at, complaints(category, raw_text)"
      )
      .order("created_at", { ascending: false })
      .limit(MAX_NOTIFICATIONS);

    if (error) {
      console.error("Error fetching notifications:", error.message);
      setIsLoading(false);
      return;
    }

    // Shape the data
    type Row = {
      id: string;
      complaint_id: string;
      note: string;
      status_at_time: string;
      created_at: string;
      complaints: { category: string | null; raw_text: string } | null;
    };

    const items: NotificationItem[] = ((data as unknown as Row[]) || []).map(
      (row) => {
        const category = row.complaints?.category;
        const rawText = row.complaints?.raw_text || "";
        const title =
          category || (rawText.length > 60 ? rawText.slice(0, 57) + "…" : rawText);

        return {
          id: row.id,
          complaintId: row.complaint_id,
          complaintTitle: title,
          note: row.note
            .replace(/\s*\[AFTER_IMAGE:https?:\/\/[^\]]+\]/g, "")
            .trim(),
          statusAtTime: row.status_at_time,
          createdAt: row.created_at,
        };
      }
    );

    setNotifications(items);

    // Compute unread count
    const lastSeen = getLastSeen();
    if (lastSeen) {
      const lastSeenTime = new Date(lastSeen).getTime();
      const count = items.filter(
        (n) => new Date(n.createdAt).getTime() > lastSeenTime
      ).length;
      setUnreadCount(count);
    } else {
      // First visit — show updates from the last 24 hours as "unread"
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      const count = items.filter(
        (n) => new Date(n.createdAt).getTime() > cutoff
      ).length;
      setUnreadCount(count);
    }

    setIsLoading(false);
  }, []);

  // ── Mark all as seen ──
  const markAllSeen = useCallback(() => {
    setLastSeen(new Date().toISOString());
    setUnreadCount(0);
  }, []);

  // ── Initial fetch + polling ──
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return { notifications, unreadCount, isLoading, markAllSeen };
}
