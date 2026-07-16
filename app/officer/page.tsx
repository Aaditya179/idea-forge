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
import { Shield, Sparkles } from "lucide-react";

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#fbefe3] border border-[#f6ddc4] text-[#c86d28] text-xs font-semibold mb-3 shadow-sm">
            <Shield className="w-3.5 h-3.5 text-[#c86d28]" />
            <span>Officer Queue Portal</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#1c1917]">Department Queue</h1>
          <p className="text-base text-[#4a423a] mt-1.5">
            Grievances routed and prioritized for municipal field resolution
          </p>
        </div>

        {/* Status filter */}
        <select
          id="officer-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ComplaintStatus | "all")}
          className="px-4 py-2.5 rounded-xl border border-[#e6dfd3] bg-white text-sm font-semibold text-[#1c1917] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#c86d28] focus:border-transparent cursor-pointer"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* KPI Cards */}
      <KPIGrid complaints={complaints} className="mb-10" />

      {/* Complaint Density Map */}
      <div className="mb-10">
        <div className="bg-white rounded-2xl border border-[#e6dfd3] overflow-hidden shadow-sm">
          <div className="px-6 py-4.5 border-b border-[#e6dfd3] bg-[#faf6f0] flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1c1917]">Complaint Density Map</h2>
              <p className="text-xs font-mono text-[#7a6f64] mt-0.5">Geo-spatial cluster distribution across municipal wards</p>
            </div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-[#fbefe3] text-[#c86d28] border border-[#f6ddc4]">
              Live GIS Feed
            </span>
          </div>
          <ComplaintsMapLoader points={mapPoints} />
        </div>
      </div>
      {/* Complaints table */}
      {complaints.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-[#e6dfd3] p-8 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#fbefe3] border border-[#f6ddc4] flex items-center justify-center mx-auto mb-5 shadow-sm">
            <svg className="w-7 h-7 text-[#c86d28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-[#1c1917] mb-2">
            No complaints found
          </h3>
          <p className="text-base text-[#4a423a] max-w-md mx-auto">
            {statusFilter !== "all"
              ? `No complaints with "${statusFilter}" status currently active in your department.`
              : "No complaints have been assigned to your department queue yet."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#e6dfd3] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e6dfd3] bg-[#faf6f0]">
                  <th className="text-left text-xs font-mono font-bold text-[#7a6f64] uppercase tracking-wider px-6 py-4">
                    Complaint
                  </th>
                  <th className="text-left text-xs font-mono font-bold text-[#7a6f64] uppercase tracking-wider px-6 py-4">
                    Citizen
                  </th>
                  <th className="text-left text-xs font-mono font-bold text-[#7a6f64] uppercase tracking-wider px-6 py-4">
                    Priority
                  </th>
                  <th className="text-left text-xs font-mono font-bold text-[#7a6f64] uppercase tracking-wider px-6 py-4">
                    Status
                  </th>
                  <th className="text-left text-xs font-mono font-bold text-[#7a6f64] uppercase tracking-wider px-6 py-4">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((complaint) => (
                  <tr
                    key={complaint.id}
                    className="border-b border-[#e6dfd3] last:border-0 hover:bg-[#faf6f0]/60 transition-colors"
                  >
                    <td className="px-6 py-4.5">
                      <Link
                        href={`/officer/${complaint.id}`}
                        className="text-sm font-bold text-[#1c1917] hover:text-[#c86d28] transition-colors line-clamp-1"
                      >
                        {complaint.raw_text}
                      </Link>
                      {complaint.category && (
                        <span className="text-xs text-[#7a6f64] font-medium block mt-1">{complaint.category}</span>
                      )}
                      {complaint.cluster_id && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#2f5a82] bg-[#e8f1f8] border border-[#b8d4ea] px-2 py-0.5 rounded-full mt-1.5">
                          🔗 Clustered
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4.5 text-sm font-semibold text-[#4a423a]">
                      {(complaint.profiles as unknown as { full_name: string })?.full_name || "—"}
                    </td>
                    <td className="px-6 py-4.5">
                      <PriorityBadge priority={complaint.priority as Priority | null} />
                    </td>
                    <td className="px-6 py-4.5">
                      <StatusBadge status={complaint.status as ComplaintStatus} />
                    </td>
                    <td className="px-6 py-4.5 text-xs font-mono text-[#7a6f64] whitespace-nowrap">
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
