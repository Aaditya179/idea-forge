"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getAllComplaints } from "@/lib/queries/complaints";
import { getDepartments } from "@/lib/queries/departments";
import StatusBadge from "@/components/StatusBadge";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import type { Complaint, ComplaintStatus, Department } from "@/lib/types";

const STATUS_OPTIONS: { value: ComplaintStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "submitted", label: "Submitted" },
  { value: "in_review", label: "In Review" },
  { value: "assigned", label: "Assigned" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
];

export default function AdminAllComplaintsPage() {
  const supabase = createClient();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | "all">("all");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    const [depts, data] = await Promise.all([
      getDepartments(supabase),
      getAllComplaints(supabase, {
        departmentId: departmentFilter || undefined,
        status: statusFilter,
      }),
    ]);

    setDepartments(depts);
    setComplaints(data);
    setLoading(false);
  }, [supabase, statusFilter, departmentFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingSpinner message="Loading complaints..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">All Complaints</h1>
          <p className="text-sm text-text-secondary mt-1">
            View and manage complaints across all departments
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            id="admin-dept-filter"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-border bg-white text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>

          <select
            id="admin-status-filter"
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
      </div>

      {/* Complaints table */}
      {complaints.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-1">
            No complaints found
          </h3>
          <p className="text-sm text-text-secondary">
            No complaints match the selected filters.
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
                    Department
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
                        href={`/admin/complaints/${complaint.id}`}
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
                    <td className="px-5 py-4 text-sm text-text-secondary">
                      {(complaint.departments as unknown as { name: string })?.name || "—"}
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
    </>
  );
}
