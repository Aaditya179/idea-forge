import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { getCitizenComplaints } from "@/lib/queries/complaints";
import StatusBadge from "@/components/StatusBadge";
import DuplicateBanner from "@/components/DuplicateBanner";
import type { ComplaintStatus } from "@/lib/types";

export default async function CitizenDashboard() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) return null;

  const complaints = await getCitizenComplaints(supabase, profile.id);

  return (
    <>
      {/* Post-submission duplicate banner — reads ?similar=N from URL */}
      <Suspense fallback={null}>
        <DuplicateBanner />
      </Suspense>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">My Complaints</h1>
          <p className="text-sm text-text-secondary mt-1">
            Track and manage your civic grievances
          </p>
        </div>
        <Link
          href="/citizen/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-semibold hover:from-primary-700 hover:to-primary-600 transition-all shadow-md shadow-primary-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Complaint
        </Link>
      </div>

      {/* Complaints list */}
      {complaints.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-1">
            No complaints yet
          </h3>
          <p className="text-sm text-text-secondary mb-6">
            Submit your first complaint to get started
          </p>
          <Link
            href="/citizen/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            Submit a Complaint
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((complaint) => (
            <Link
              key={complaint.id}
              href={`/citizen/${complaint.id}`}
              className="block bg-white rounded-xl border border-border p-5 hover:border-primary-200 hover:shadow-md hover:shadow-primary-50 transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary line-clamp-2 group-hover:text-primary-700 transition-colors">
                    {complaint.raw_text}
                  </p>
                  <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                    {complaint.category && (
                      <span className="text-xs font-medium text-text-muted bg-surface-overlay px-2 py-0.5 rounded-md">
                        {complaint.category}
                      </span>
                    )}
                    {complaint.cluster_id && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                        🔗 Clustered
                      </span>
                    )}
                    <span className="text-xs text-text-muted">
                      {new Date(complaint.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <StatusBadge status={complaint.status as ComplaintStatus} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
