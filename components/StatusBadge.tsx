"use client";

import type { ComplaintStatus } from "@/lib/types";

const statusConfig: Record<
  ComplaintStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  submitted: {
    label: "Submitted",
    bg: "bg-[#e8f1f8] border-[#b8d4ea]",
    text: "text-[#2f5a82]",
    dot: "bg-[#2f5a82]",
  },
  in_review: {
    label: "In Review",
    bg: "bg-[#fbefe3] border-[#f6ddc4]",
    text: "text-[#c86d28]",
    dot: "bg-[#c86d28]",
  },
  assigned: {
    label: "Assigned",
    bg: "bg-[#f3e8ff] border-[#ddd6fe]",
    text: "text-[#5b4a8e]",
    dot: "bg-[#5b4a8e]",
  },
  resolved: {
    label: "Resolved",
    bg: "bg-[#e6f4ea] border-[#1e6f43]/20",
    text: "text-[#1e6f43]",
    dot: "bg-[#1e6f43]",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-[#fde8e8] border-[#9e3333]/20",
    text: "text-[#9e3333]",
    dot: "bg-[#9e3333]",
  },
};

interface StatusBadgeProps {
  status: ComplaintStatus;
  className?: string;
}

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.submitted;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${config.bg} ${config.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
