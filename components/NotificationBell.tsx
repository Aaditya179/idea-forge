"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, CheckCircle2, AlertCircle, ArrowRightCircle, XCircle, Clock } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import type { NotificationItem } from "@/hooks/useNotifications";

// ──────────────────────────────────────────────────────────────
// Status → icon + color mapping (mirrors StatusBadge palette)
// ──────────────────────────────────────────────────────────────

const statusConfig: Record<
  string,
  { icon: React.ReactNode; accent: string; bg: string; label: string }
> = {
  submitted: {
    icon: <Clock className="w-4 h-4" />,
    accent: "text-[#2f5a82]",
    bg: "bg-[#e8f1f8]",
    label: "Submitted",
  },
  in_review: {
    icon: <AlertCircle className="w-4 h-4" />,
    accent: "text-[#c86d28]",
    bg: "bg-[#fbefe3]",
    label: "In Review",
  },
  assigned: {
    icon: <ArrowRightCircle className="w-4 h-4" />,
    accent: "text-[#5b4a8e]",
    bg: "bg-[#f3e8ff]",
    label: "Assigned",
  },
  resolved: {
    icon: <CheckCircle2 className="w-4 h-4" />,
    accent: "text-[#1e6f43]",
    bg: "bg-[#e6f4ea]",
    label: "Resolved",
  },
  rejected: {
    icon: <XCircle className="w-4 h-4" />,
    accent: "text-[#9e3333]",
    bg: "bg-[#fde8e8]",
    label: "Rejected",
  },
};

function getStatusConfig(status: string) {
  return (
    statusConfig[status] || {
      icon: <Clock className="w-4 h-4" />,
      accent: "text-[#7a6f64]",
      bg: "bg-[#faf6f0]",
      label: status,
    }
  );
}

// ──────────────────────────────────────────────────────────────
// Relative time helper
// ──────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

// ──────────────────────────────────────────────────────────────
// NotificationBell Component
// ──────────────────────────────────────────────────────────────

export default function NotificationBell() {
  const { notifications, unreadCount, isLoading, markAllSeen } =
    useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening) {
      markAllSeen();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-full text-[#4a423a] hover:bg-white hover:text-[#c86d28] transition-colors cursor-pointer"
        title="Notifications"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#c86d28] text-white text-[10px] font-bold leading-none shadow-sm animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[380px] max-h-[480px] bg-white rounded-2xl border border-[#e6dfd3] shadow-xl shadow-black/10 overflow-hidden z-50 flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 border-b border-[#e6dfd3] flex items-center justify-between shrink-0 bg-[#faf6f0]">
            <h3 className="text-sm font-bold text-[#1c1917] tracking-tight">
              Notifications
            </h3>
            {notifications.length > 0 && (
              <button
                onClick={markAllSeen}
                className="text-xs font-medium text-[#c86d28] hover:text-[#b35c1e] transition-colors cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="overflow-y-auto flex-1 overscroll-contain">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 border-2 border-[#e6dfd3] border-t-[#c86d28] rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#faf6f0] border border-[#e6dfd3] flex items-center justify-center mb-3">
                  <Bell className="w-5 h-5 text-[#7a6f64]" />
                </div>
                <p className="text-sm font-semibold text-[#1c1917] mb-1">
                  No recent updates
                </p>
                <p className="text-xs text-[#7a6f64]">
                  You&apos;ll be notified when there&apos;s progress on your
                  complaints.
                </p>
              </div>
            ) : (
              <ul>
                {notifications.map((item: NotificationItem) => {
                  const config = getStatusConfig(item.statusAtTime);
                  return (
                    <li key={item.id}>
                      <Link
                        href={`/citizen/${item.complaintId}`}
                        onClick={() => setIsOpen(false)}
                        className="flex gap-3.5 px-5 py-4 hover:bg-[#faf6f0] transition-colors border-b border-[#e6dfd3] last:border-b-0 group"
                      >
                        {/* Status icon */}
                        <div
                          className={`w-9 h-9 rounded-xl ${config.bg} border border-current/10 flex items-center justify-center ${config.accent} shrink-0 mt-0.5`}
                        >
                          {config.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider ${config.accent}`}
                            >
                              {config.label}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-[#1c1917] leading-snug line-clamp-1 group-hover:text-[#c86d28] transition-colors">
                            {item.complaintTitle}
                          </p>
                          <p className="text-xs text-[#4a423a] mt-0.5 line-clamp-2 leading-relaxed">
                            {item.note}
                          </p>
                          <p className="text-[10px] font-mono text-[#7a6f64] mt-1.5">
                            {timeAgo(item.createdAt)}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
