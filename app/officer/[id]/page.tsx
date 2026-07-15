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
  getDuplicateStats,
} from "@/lib/queries/complaints";
import StatusBadge from "@/components/StatusBadge";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import AISummaryCard from "@/components/officer/AISummaryCard";
import SuggestedActionCard from "@/components/officer/SuggestedActionCard";
import ComplaintsMapLoader from "@/components/admin/ComplaintsMapLoader";
import type { ComplaintMapPoint } from "@/lib/queries/complaints";
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

  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<{
    summary: string;
    suggestedAction: string;
    confidence: "high" | "medium" | "low";
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Duplicate cluster stats (reuses admin getDuplicateStats query)
  const [duplicateStats, setDuplicateStats] = useState<{ clusterCount: number; hoursSaved: number } | null>(null);

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

    // Fetch duplicate cluster stats (same query the admin detail page uses)
    const dupStats = await getDuplicateStats(supabase, c.category ?? '', c.location_text);
    setDuplicateStats(dupStats);

    const u = await getComplaintUpdates(supabase, id);
    setUpdates(u);
    setLoading(false);

    // Trigger AI analysis after data is loaded
    if (c) {
      fetchAIAnalysis(c, u);
    }
  }, [supabase, id]);

  const fetchAIAnalysis = async (complaint: Complaint, updates: ComplaintUpdateType[]) => {
    setAiLoading(true);
    setAiError(null);

    try {
      const daysSinceSubmitted = Math.floor(
        (Date.now() - new Date(complaint.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      const response = await fetch("/api/analyze-complaint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          complaintText: complaint.raw_text,
          category: complaint.category,
          status: complaint.status,
          location: complaint.location_text,
          priority: complaint.priority,
          timelineLength: updates.length,
          daysSinceSubmitted,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze complaint");
      }

      const data = await response.json();
      if (data.success) {
        setAiAnalysis({
          summary: data.summary,
          suggestedAction: data.suggestedAction,
          confidence: data.confidence,
        });
      } else {
        throw new Error(data.error || "Analysis failed");
      }
    } catch (err) {
      console.error("AI Analysis error:", err);
      setAiError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAiLoading(false);
    }
  };

  const retryAIAnalysis = () => {
    if (complaint && updates) {
      fetchAIAnalysis(complaint, updates);
    }
  };

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

          {/* Location map */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">Location</h2>
            {complaint.latitude != null && complaint.longitude != null ? (
              <div className="rounded-lg overflow-hidden border border-border">
                <ComplaintsMapLoader
                  points={[
                    {
                      id: complaint.id,
                      latitude: complaint.latitude,
                      longitude: complaint.longitude,
                      category: complaint.category,
                      department_name: complaint.departments?.name || "Unassigned",
                      status: complaint.status,
                    } satisfies ComplaintMapPoint,
                  ]}
                />
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center rounded-lg border border-dashed border-border bg-surface-raised">
                <p className="text-sm text-text-muted">Location unavailable</p>
              </div>
            )}
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
        <div className="lg:col-span-1 space-y-6">
          {/* Similar Complaints Nearby — category + location heuristic from getDuplicateStats */}
          {duplicateStats && (
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Similar Complaints Nearby
              </h2>
              <div className="space-y-3">
                <div className="p-3 bg-violet-50 border border-violet-100 rounded-lg">
                  <div className="text-2xl font-bold text-violet-900">
                    {duplicateStats.clusterCount} {duplicateStats.clusterCount === 1 ? 'Case' : 'Cases'}
                  </div>
                  <div className="text-xs text-violet-700 font-medium mt-0.5">
                    {duplicateStats.clusterCount > 1
                      ? `Part of a cluster of ${duplicateStats.clusterCount} complaints with similar category and nearby location`
                      : 'Unique complaint — no similar complaints found nearby'}
                  </div>
                </div>
                {duplicateStats.hoursSaved > 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-900">
                    {duplicateStats.hoursSaved} {duplicateStats.hoursSaved === 1 ? 'Hour' : 'Hours'}
                  </div>
                  <div className="text-xs text-emerald-700 font-medium mt-0.5">
                    Estimated time saved by clustering related complaints
                  </div>
                </div>
                )}
              </div>
            </div>
          )}

          {/* AI Summary */}
          <AISummaryCard
            summary={aiAnalysis?.summary || ""}
            confidence={aiAnalysis?.confidence || "medium"}
            loading={aiLoading}
            error={aiError}
            onRetry={retryAIAnalysis}
          />

          {/* Suggested Action */}
          <SuggestedActionCard
            suggestedAction={aiAnalysis?.suggestedAction || ""}
            confidence={aiAnalysis?.confidence || "medium"}
            loading={aiLoading}
            error={aiError}
            onRetry={retryAIAnalysis}
          />

          {/* Timeline */}
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
