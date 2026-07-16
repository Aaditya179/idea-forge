"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { getOfficerComplaints } from "@/lib/queries/complaints";
import StatusBadge from "@/components/StatusBadge";
import ComplaintsMapLoader from "@/components/admin/ComplaintsMapLoader";
import type { ComplaintMapPoint } from "@/lib/queries/complaints";
import PriorityBadge from "@/components/PriorityBadge";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import KPIGrid from "@/components/officer/KPIGrid";
import OfficerChatBot from "@/components/officer/OfficerChatBot";
import type { Complaint, ComplaintStatus, Profile, Priority } from "@/lib/types";

const STATUS_OPTIONS: { value: ComplaintStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "submitted", label: "Submitted" },
  { value: "in_review", label: "In Review" },
  { value: "assigned", label: "Assigned" },
  { value: "resolved", label: "Resolved" },
];

export default function OfficerDashboard() {
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Priority queue sorting function
  const sortComplaintsByPriority = (complaints: Complaint[]): Complaint[] => {
    const priorityOrder: { [key: string]: number } = {
      'high': 3,
      'medium': 2,
      'low': 1
    };

    return [...complaints].sort((a, b) => {
      // First sort by priority (high to low)
      const aPriority = a.priority ? priorityOrder[a.priority] : 0;
      const bPriority = b.priority ? priorityOrder[b.priority] : 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }
      
      // Within same priority, sort by created_at descending (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    const p = await getCurrentProfile(supabase);
    if (!p || !p.department_id) {
      setError("Unable to load your profile or department.");
      setLoading(false);
      return;
    }
    setProfile(p);

    const data = await getOfficerComplaints(supabase, p.department_id, statusFilter);
    setComplaints(sortComplaintsByPriority(data));
    setLoading(false);
  }, [supabase, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derive map points from already-fetched complaints — no additional queries
  const mapPoints = useMemo<ComplaintMapPoint[]>(
    () =>
      complaints
        .filter((c): c is Complaint & { latitude: number; longitude: number } =>
          c.latitude != null && c.longitude != null
        )
        .map((c) => ({
          id: c.id,
          latitude: c.latitude,
          longitude: c.longitude,
          category: c.category,
          department_name:
            (c.departments as unknown as { name: string })?.name || "Unknown",
          status: c.status,
          priority: c.priority,
        })),
    [complaints]
  );

  if (loading) return <LoadingSpinner message="Loading complaints..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Department Queue</h1>
          <p className="text-sm text-text-secondary mt-1">
            Complaints assigned to your department
          </p>
        </div>

        {/* Status filter */}
        <select
          id="officer-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ComplaintStatus | "all")}
          className="px-3.5 py-2 rounded-xl border border-border bg-white text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* KPI Cards */}
      <KPIGrid complaints={complaints} className="mb-8" />

      {/* Complaint Density Map */}
      <div className="mb-8">
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-surface-raised">
            <h2 className="text-base font-bold text-text-primary">Complaint Density Map</h2>
            <p className="text-xs text-text-muted mt-0.5">Geo-distribution of your department&apos;s complaints</p>
          </div>
          <ComplaintsMapLoader points={mapPoints} />
        </div>
      </div>
      {/* Complaints table */}
      {complaints.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-1">
            No complaints found
          </h3>
          <p className="text-sm text-text-secondary">
            {statusFilter !== "all"
              ? `No complaints with "${statusFilter}" status in your department.`
              : "No complaints have been assigned to your department yet."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-raised">
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">
                    Complaint
                  </th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">
                    Citizen
                  </th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">
                    Priority
                  </th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((complaint) => (
                  <tr
                    key={complaint.id}
                    className="border-b border-border last:border-0 hover:bg-surface-raised transition-colors"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/officer/${complaint.id}`}
                        className="text-sm font-medium text-text-primary hover:text-primary-600 transition-colors line-clamp-1"
                      >
                        {complaint.raw_text}
                      </Link>
                      {complaint.category && (
                        <span className="text-xs text-text-muted block mt-0.5">{complaint.category}</span>
                      )}
                      {complaint.cluster_id && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded mt-1">
                          🔗 Clustered
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-text-secondary">
                      {(complaint.profiles as unknown as { full_name: string })?.full_name || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <PriorityBadge priority={complaint.priority as Priority | null} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={complaint.status as ComplaintStatus} />
                    </td>
                    <td className="px-5 py-4 text-sm text-text-muted whitespace-nowrap">
                      {new Date(complaint.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Officer Copilot floating chatbot — receives live queue as context */}
      <OfficerChatBot
        queue={complaints.map((c) => ({
          id: c.id,
          raw_text: c.raw_text,
          category: c.category ?? null,
          status: c.status,
          priority: c.priority ?? null,
          location_text: (c as unknown as { location_text?: string }).location_text ?? null,
          created_at: c.created_at,
        }))}
        departmentName={
          profile
            ? `${(profile as unknown as { departments?: { name: string } }).departments?.name ?? "Your Department"}`
            : "Municipal Services"
        }
      />
    </>
  );
}
