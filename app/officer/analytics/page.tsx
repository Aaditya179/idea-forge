"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { getOfficerComplaints } from "@/lib/queries/complaints";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import type { Complaint, ComplaintStatus, Priority } from "@/lib/types";

const PRIORITY_LABELS: { priority: Priority; label: string; color: string; bg: string }[] = [
  { priority: "high", label: "High", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  { priority: "medium", label: "Medium", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  { priority: "low", label: "Low", color: "text-slate-600", bg: "bg-slate-50 border-slate-200" },
];

export default function OfficerAnalytics() {
  const supabase = createClient();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    const p = await getCurrentProfile(supabase);
    if (!p || !p.department_id) {
      setError("Unable to load your profile or department.");
      setLoading(false);
      return;
    }

    const data = await getOfficerComplaints(supabase, p.department_id);
    setComplaints(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Priority distribution computed from existing data
  const priorityDist = useMemo(() => {
    const counts: Record<string, number> = { high: 0, medium: 0, low: 0, unset: 0 };
    for (const c of complaints) {
      if (c.priority && counts[c.priority] !== undefined) {
        counts[c.priority] += 1;
      } else {
        counts.unset += 1;
      }
    }
    return counts;
  }, [complaints]);

  // Status distribution
  const statusDist = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of complaints) {
      counts[c.status] = (counts[c.status] || 0) + 1;
    }
    return counts;
  }, [complaints]);

  if (loading) return <LoadingSpinner message="Loading analytics..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;

  const total = complaints.length;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
        <p className="text-sm text-text-secondary mt-1">
          Complaint priority and status distribution for your department
        </p>
      </div>



      {/* Distribution Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Priority Distribution */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-surface-raised">
            <h2 className="text-base font-bold text-text-primary">By Priority</h2>
            <p className="text-xs text-text-muted mt-0.5">Complaint breakdown by severity</p>
          </div>
          <div className="p-5 space-y-3">
            {PRIORITY_LABELS.map(({ priority, label, color, bg }) => {
              const count = priorityDist[priority] || 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={priority} className={`flex items-center justify-between px-4 py-3 rounded-lg border ${bg}`}>
                  <span className={`text-sm font-semibold ${color}`}>{label}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          priority === "high" ? "bg-red-500" : priority === "medium" ? "bg-amber-500" : "bg-slate-400"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`text-sm font-bold ${color} min-w-[3rem] text-right`}>
                      {count} <span className="text-xs font-normal">({pct}%)</span>
                    </span>
                  </div>
                </div>
              );
            })}
            {priorityDist.unset > 0 && (
              <div className="flex items-center justify-between px-4 py-3 rounded-lg border bg-gray-50 border-gray-200">
                <span className="text-sm font-semibold text-gray-500">Unassigned</span>
                <span className="text-sm font-bold text-gray-500">
                  {priorityDist.unset} <span className="text-xs font-normal">({total > 0 ? Math.round((priorityDist.unset / total) * 100) : 0}%)</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-surface-raised">
            <h2 className="text-base font-bold text-text-primary">By Status</h2>
            <p className="text-xs text-text-muted mt-0.5">Current status distribution</p>
          </div>
          <div className="p-5 space-y-3">
            {(["submitted", "in_review", "assigned", "resolved", "rejected"] as ComplaintStatus[]).map((status) => {
              const count = statusDist[status] || 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              const colorMap: Record<string, { text: string; bar: string; bg: string }> = {
                submitted: { text: "text-blue-700", bar: "bg-blue-500", bg: "bg-blue-50 border-blue-200" },
                in_review: { text: "text-amber-700", bar: "bg-amber-500", bg: "bg-amber-50 border-amber-200" },
                assigned: { text: "text-violet-700", bar: "bg-violet-500", bg: "bg-violet-50 border-violet-200" },
                resolved: { text: "text-emerald-700", bar: "bg-emerald-500", bg: "bg-emerald-50 border-emerald-200" },
                rejected: { text: "text-red-700", bar: "bg-red-500", bg: "bg-red-50 border-red-200" },
              };
              const c = colorMap[status] || { text: "text-gray-700", bar: "bg-gray-500", bg: "bg-gray-50 border-gray-200" };
              return (
                <div key={status} className={`flex items-center justify-between px-4 py-3 rounded-lg border ${c.bg}`}>
                  <span className={`text-sm font-semibold capitalize ${c.text}`}>{status.replace("_", " ")}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={`text-sm font-bold ${c.text} min-w-[3rem] text-right`}>
                      {count} <span className="text-xs font-normal">({pct}%)</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
