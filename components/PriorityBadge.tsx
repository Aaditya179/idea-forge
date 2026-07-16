"use client";

import type { Priority } from "@/lib/types";

const priorityConfig: Record<
  Priority,
  { label: string; bg: string; text: string; dot: string }
> = {
  high: {
    label: "High",
    bg: "bg-[#fde8e8] border-[#9e3333]/20",
    text: "text-[#9e3333]",
    dot: "bg-[#9e3333]",
  },
  medium: {
    label: "Medium",
    bg: "bg-[#fbefe3] border-[#f6ddc4]",
    text: "text-[#c86d28]",
    dot: "bg-[#c86d28]",
  },
  low: {
    label: "Low",
    bg: "bg-[#e6f4ea] border-[#1e6f43]/20",
    text: "text-[#1e6f43]",
    dot: "bg-[#1e6f43]",
  },
};

interface PriorityBadgeProps {
  priority: Priority | null;
  className?: string;
}

export default function PriorityBadge({ priority, className = "" }: PriorityBadgeProps) {
  if (!priority) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border bg-white border-[#e6dfd3] text-[#7a6f64] ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#7a6f64]" />
        —
      </span>
    );
  }

  const config = priorityConfig[priority];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${config.bg} ${config.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}