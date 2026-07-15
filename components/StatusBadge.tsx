"use client";

import type { ComplaintStatus } from "@/lib/types";

const statusConfig: Record<
  ComplaintStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  submitted: {
    label: "Submitted",
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  in_review: {
    label: "In Review",
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  assigned: {
    label: "Assigned",
    bg: "bg-violet-50 border-violet-200",
    text: "text-violet-700",
    dot: "bg-violet-500",
  },
  resolved: {
    label: "Resolved",
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-red-50 border-red-200",
    text: "text-red-700",
    dot: "bg-red-500",
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
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
