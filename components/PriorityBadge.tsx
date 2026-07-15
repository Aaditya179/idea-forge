"use client";

import type { Priority } from "@/lib/types";

const priorityConfig: Record<
  Priority,
  { label: string; bg: string; text: string; dot: string }
> = {
  high: {
    label: "High",
    bg: "bg-red-50 border-red-200",
    text: "text-red-700",
    dot: "bg-red-500",
  },
  medium: {
    label: "Medium",
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  low: {
    label: "Low",
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
};

interface PriorityBadgeProps {
  priority: Priority | null;
  className?: string;
}

export default function PriorityBadge({ priority, className = "" }: PriorityBadgeProps) {
  if (!priority) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-gray-50 border-gray-200 text-gray-500 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        —
      </span>
    );
  }

  const config = priorityConfig[priority];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}