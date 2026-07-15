"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getCurrentProfile } from "@/lib/queries/profiles";
import {
  getComplaintById,
  getComplaintUpdates,
  updateComplaintStatus,
  createComplaintUpdate,
} from "@/lib/queries/complaints";
import StatusBadge from "@/components/StatusBadge";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import type { Complaint, ComplaintUpdate as ComplaintUpdateType, ComplaintStatus } from "@/lib/types";

const STATUS_OPTIONS: ComplaintStatus[] = [
  "submitted",
  "in_review",
  "assigned",
  "resolved",
  "rejected",
];

export default function OfficerComplaintDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [updates, setUpdates] = useState<ComplaintUpdateType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Status update form
  const [newStatus, setNewStatus] = useState<ComplaintStatus>("in_review");
  const [updateNote, setUpdateNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    const c = await getComplaintById(supabase, id);
    if (!c) {
      setError("Complaint not found.");
      setLoading(false);
      return;
    }
    setComplaint(c);
    setNewStatus(c.status as ComplaintStatus);

    const u = await getComplaintUpdates(supabase, id);
    setUpdates(u);
    setLoading(false);
  }, [supabase, id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !updateNote.trim()) return;

    setUpdating(true);

    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      setError("Unable to load profile.");
      setUpdating(false);
      return;
    }

    // Update complaint status
    const success = await updateComplaintStatus(supabase, complaint.id, newStatus);
    if (!success) {
      setError("Failed to update status.");
      setUpdating(false);
      return;
    }

    // Insert update record
    await createComplaintUpdate(supabase, {
      complaint_id: complaint.id,
      note: updateNote,
      status_at_time: newStatus,
      updated_by: profile.id,
    });

    setUpdateNote("");
    await fetchData();
    setUpdating(false);
  };

  if (loading) return <LoadingSpinner message="Loading complaint..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;
  if (!complaint) return null;

  return (
    <>
      {/* Back link */}
      <Link
        href="/officer"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary-600 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Department Queue
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Complaint details */}
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-xl font-bold text-text-primary">Complaint Details</h1>
              <StatusBadge status={complaint.status as ComplaintStatus} />
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                  Description
                </h3>
                <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                  {complaint.raw_text}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                    Citizen
                  </h3>
                  <p className="text-sm font-medium text-text-primary">
                    {(complaint.profiles as unknown as { full_name: string })?.full_name || "—"}
                  </p>
                </div>
                {complaint.category && (
                  <div>
                    <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                      Category
                    </h3>
                    <p className="text-sm font-medium text-text-primary">{complaint.category}</p>
                  </div>
                )}
                {complaint.location_text && (
                  <div>
                    <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                      Location
                    </h3>
                    <p className="text-sm font-medium text-text-primary">{complaint.location_text}</p>
                  </div>
                )}
                <div>
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                    Submitted
                  </h3>
                  <p className="text-sm font-medium text-text-primary">
                    {new Date(complaint.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {complaint.image_url && (
                <div>
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    Attached Image
                  </h3>
                  <img
                    src={complaint.image_url}
                    alt="Complaint attachment"
                    className="rounded-lg border border-border max-h-64 object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Status update form */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">Update Status</h2>
            <form onSubmit={handleStatusUpdate} className="space-y-4">
              <div>
                <label htmlFor="officer-new-status" className="block text-sm font-medium text-text-primary mb-1.5">
                  New Status
                </label>
                <select
                  id="officer-new-status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-raised text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="officer-update-note" className="block text-sm font-medium text-text-primary mb-1.5">
                  Note
                </label>
                <textarea
                  id="officer-update-note"
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-raised text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="Add a note about this status change..."
                />
              </div>

              <button
                type="submit"
                disabled={updating || !updateNote.trim()}
                className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {updating ? "Updating..." : "Update Status"}
              </button>
            </form>
          </div>
        </div>

        {/* Timeline sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">Timeline</h2>

            {updates.length === 0 ? (
              <p className="text-sm text-text-muted">No updates yet.</p>
            ) : (
              <div className="space-y-0">
                {updates.map((update, idx) => (
                  <div key={update.id} className="relative flex gap-3">
                    {idx < updates.length - 1 && (
                      <div className="absolute left-[7px] top-5 bottom-0 w-px bg-border" />
                    )}
                    <div className="relative z-10 mt-1.5 w-[15px] flex-shrink-0 flex items-start justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-violet-500 ring-2 ring-violet-100" />
                    </div>
                    <div className="pb-6 flex-1">
                      <p className="text-sm font-medium text-text-primary">{update.note}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={update.status_at_time as ComplaintStatus} />
                      </div>
                      {update.profiles && (
                        <p className="text-xs text-text-muted mt-1">
                          by {(update.profiles as unknown as { full_name: string })?.full_name}
                        </p>
                      )}
                      <p className="text-xs text-text-muted mt-0.5">
                        {new Date(update.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
