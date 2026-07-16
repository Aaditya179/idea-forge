"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getCurrentProfile } from "@/lib/queries/profiles";
import {
  getComplaintById,
  getComplaintUpdates,
  updateComplaintStatus,
  createComplaintUpdate,
  getClusterComplaints,
  uploadComplaintImage,
} from "@/lib/queries/complaints";
import StatusBadge from "@/components/StatusBadge";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import AISummaryCard from "@/components/officer/AISummaryCard";
import SuggestedActionCard from "@/components/officer/SuggestedActionCard";
import ComplaintsMapLoader from "@/components/admin/ComplaintsMapLoader";
import type { ComplaintMapPoint } from "@/lib/queries/complaints";
import type { Complaint, ComplaintUpdate as ComplaintUpdateType, ComplaintStatus } from "@/lib/types";

// ── Types ─────────────────────────────────────────────────────────────────────
interface AuditResult {
  status: "VERIFIED" | "REJECTED";
  confidence_score: number;
  reasoning: string;
  afterImageUrl: string;
}

type ResolveStep = "idle" | "upload" | "auditing" | "done";

const STATUS_OPTIONS: ComplaintStatus[] = [
  "submitted",
  "in_review",
  "assigned",
  "resolved",
  "rejected",
];

// ── Resolution Auditor Panel ──────────────────────────────────────────────────
function ResolutionAuditorPanel({
  complaint,
  onAuditComplete,
  onCancel,
}: {
  complaint: Complaint;
  onAuditComplete: (result: AuditResult) => void;
  onCancel: () => void;
}) {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<ResolveStep>("upload");
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setAuditError(null);
  };

  const handleSubmit = async () => {
    if (!selectedFile || uploading) return;
    setUploading(true);
    setAuditError(null);

    try {
      const profile = await getCurrentProfile(supabase);
      if (!profile) throw new Error("Could not load your profile.");

      // 1. Upload after photo
      const afterUrl = await uploadComplaintImage(supabase, selectedFile, profile.id);
      if (!afterUrl) throw new Error("Image upload failed. Check storage bucket permissions.");

      // 2. Run Groq vision audit
      setStep("auditing");

      const res = await fetch("/api/complaints/verify-resolution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaint_id: complaint.id,
          before_image_url: complaint.image_url ?? null,
          after_image_url: afterUrl,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Verification API failed.");
      }

      const data = await res.json();
      setStep("done");
      onAuditComplete({ ...data, afterImageUrl: afterUrl });
    } catch (err) {
      setAuditError(err instanceof Error ? err.message : "Unknown error.");
      setStep("upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-border p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">AI Resolution Auditor</h2>
            <p className="text-xs text-text-muted">Upload proof of completed work to close this ticket</p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-xs text-text-muted hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50 cursor-pointer"
        >
          ✕ Cancel
        </button>
      </div>

      {/* Side-by-side photo comparison */}
      <div className="grid grid-cols-2 gap-3">
        {/* Before */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Before Photo</p>
          {complaint.image_url ? (
            <img
              src={complaint.image_url}
              alt="Before"
              className="w-full h-36 object-cover rounded-lg border border-border"
            />
          ) : (
            <div className="w-full h-36 rounded-lg border border-dashed border-border bg-surface-raised flex items-center justify-center">
              <p className="text-xs text-text-muted text-center px-2">No before photo<br />(text-only submission)</p>
            </div>
          )}
        </div>

        {/* After */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">After Photo</p>
          {preview ? (
            <img
              src={preview}
              alt="After"
              className="w-full h-36 object-cover rounded-lg border border-violet-300"
            />
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full h-36 rounded-lg border-2 border-dashed border-violet-300 bg-violet-50/40 flex flex-col items-center justify-center gap-2 hover:bg-violet-50 transition-colors cursor-pointer"
            >
              <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-xs font-medium text-violet-600">Tap to upload</span>
            </button>
          )}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {preview && (
        <button
          onClick={() => fileRef.current?.click()}
          className="text-xs text-violet-600 hover:underline cursor-pointer"
        >
          Change photo
        </button>
      )}

      {auditError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          ⚠️ {auditError}
        </div>
      )}

      {/* Auditing loader */}
      {step === "auditing" && (
        <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
          <div>
            <p className="text-sm font-semibold text-indigo-800">AI Vision Audit Running…</p>
            <p className="text-xs text-indigo-600 mt-0.5">Comparing before & after photos via Groq LLM — this takes ~5s</p>
          </div>
        </div>
      )}

      {/* Submit button */}
      {step !== "auditing" && (
        <button
          onClick={handleSubmit}
          disabled={!selectedFile || uploading}
          className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {uploading ? "Uploading…" : "🔍 Submit for AI Verification"}
        </button>
      )}
    </div>
  );
}

// ── Audit Result Panel ────────────────────────────────────────────────────────
function AuditResultPanel({
  result,
  beforeUrl,
  onConfirm,
  onRetry,
  confirming,
}: {
  result: AuditResult;
  beforeUrl: string | null;
  onConfirm: () => void;
  onRetry: () => void;
  confirming: boolean;
}) {
  const isVerified = result.status === "VERIFIED";

  return (
    <div className={`rounded-xl border p-6 space-y-5 ${isVerified ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
      {/* Verdict header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${isVerified ? "bg-emerald-100" : "bg-rose-100"}`}>
            {isVerified ? "✅" : "❌"}
          </div>
          <div>
            <p className={`text-base font-extrabold uppercase tracking-wide ${isVerified ? "text-emerald-800" : "text-rose-800"}`}>
              {isVerified ? "Resolution Verified" : "Resolution Rejected"}
            </p>
            <p className={`text-xs font-semibold ${isVerified ? "text-emerald-600" : "text-rose-600"}`}>
              Confidence: {result.confidence_score}%
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider ${isVerified ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-rose-100 text-rose-800 border-rose-200"}`}>
          {result.status}
        </div>
      </div>

      {/* Confidence bar */}
      <div>
        <div className="w-full h-2 rounded-full bg-white/60 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isVerified ? "bg-emerald-500" : "bg-rose-500"}`}
            style={{ width: `${result.confidence_score}%` }}
          />
        </div>
      </div>

      {/* AI reasoning */}
      <div className={`rounded-lg border px-4 py-3 ${isVerified ? "border-emerald-200 bg-white/60" : "border-rose-200 bg-white/60"}`}>
        <p className="text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-500">AI Reasoning</p>
        <p className="text-sm text-slate-700 leading-relaxed">{result.reasoning}</p>
      </div>

      {/* Photo comparison */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Before Photo</p>
          {beforeUrl ? (
            <img src={beforeUrl} alt="Before" className="w-full h-32 object-cover rounded-lg border border-slate-200" />
          ) : (
            <div className="w-full h-32 rounded-lg border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center">
              <span className="text-xs text-slate-400">Text-only</span>
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">After Photo</p>
          <img src={result.afterImageUrl} alt="After" className="w-full h-32 object-cover rounded-lg border border-slate-200" />
        </div>
      </div>

      {/* CTA */}
      {isVerified ? (
        <button
          onClick={onConfirm}
          disabled={confirming}
          className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {confirming ? "Closing Ticket…" : "✓ Confirm & Close Ticket"}
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-rose-700 text-center font-medium">
            This ticket cannot be closed. Please complete the repair and try again.
          </p>
          <button
            onClick={onRetry}
            className="w-full py-2.5 rounded-xl border border-rose-300 text-rose-700 text-sm font-semibold hover:bg-rose-100 transition-colors cursor-pointer"
          >
            Upload a New After Photo
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OfficerComplaintDetailPage() {
  const router = useRouter();
  void router;
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [updates, setUpdates] = useState<ComplaintUpdateType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // AI analysis
  const [aiAnalysis, setAiAnalysis] = useState<{
    summary: string;
    suggestedAction: string;
    confidence: "high" | "medium" | "low";
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Cluster
  const [clusterComplaints, setClusterComplaints] = useState<Array<{
    id: string;
    raw_text: string;
    created_at: string;
    priority: string | null;
    status: string;
    is_duplicate: boolean;
  }>>([]);

  // Status update form
  const [newStatus, setNewStatus] = useState<ComplaintStatus>("in_review");
  const [updateNote, setUpdateNote] = useState("");
  const [updating, setUpdating] = useState(false);

  // Resolution Auditor state
  const [resolveStep, setResolveStep] = useState<"hidden" | "auditor" | "result">("hidden");
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [confirmingClose, setConfirmingClose] = useState(false);

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

    if (c.cluster_id) {
      const clusterData = await getClusterComplaints(supabase, c.cluster_id, c.id);
      setClusterComplaints(clusterData);
    } else {
      setClusterComplaints([]);
    }

    const u = await getComplaintUpdates(supabase, id);
    setUpdates(u);
    setLoading(false);

    if (c) fetchAIAnalysis(c, u);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchAIAnalysis = async (c: Complaint, u: ComplaintUpdateType[]) => {
    setAiLoading(true);
    setAiError(null);
    try {
      const daysSinceSubmitted = Math.floor(
        (Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      const response = await fetch("/api/analyze-complaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaintText: c.raw_text,
          category: c.category,
          status: c.status,
          location: c.location_text,
          priority: c.priority,
          timelineLength: u.length,
          daysSinceSubmitted,
        }),
      });
      if (!response.ok) throw new Error("Failed to analyze complaint");
      const data = await response.json();
      if (data.success) {
        setAiAnalysis({ summary: data.summary, suggestedAction: data.suggestedAction, confidence: data.confidence });
      } else throw new Error(data.error || "Analysis failed");
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAiLoading(false);
    }
  };

  const retryAIAnalysis = () => { if (complaint && updates) fetchAIAnalysis(complaint, updates); };

  useEffect(() => { fetchData(); }, [fetchData]);

  // Standard (non-resolve) status update
  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !updateNote.trim()) return;

    // Intercept "resolved" → route through AI Auditor
    if (newStatus === "resolved") {
      setResolveStep("auditor");
      return;
    }

    setUpdating(true);
    const profile = await getCurrentProfile(supabase);
    if (!profile) { setError("Unable to load profile."); setUpdating(false); return; }

    const success = await updateComplaintStatus(supabase, complaint.id, newStatus);
    if (!success) { setError("Failed to update status."); setUpdating(false); return; }

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

  // Called after AI says VERIFIED — actually close the ticket
  const handleConfirmClose = async () => {
    if (!complaint || !auditResult) return;
    setConfirmingClose(true);

    const profile = await getCurrentProfile(supabase);
    if (!profile) { setError("Unable to load profile."); setConfirmingClose(false); return; }

    await updateComplaintStatus(supabase, complaint.id, "resolved");
    await createComplaintUpdate(supabase, {
      complaint_id: complaint.id,
      note: `✅ AI Resolution Auditor verified closure. Confidence: ${auditResult.confidence_score}%. After photo uploaded. Reasoning: ${auditResult.reasoning}`,
      status_at_time: "resolved",
      updated_by: profile.id,
    });

    setResolveStep("hidden");
    setAuditResult(null);
    setConfirmingClose(false);
    await fetchData();
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
        {/* ── Main column ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Complaint details */}
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-xl font-bold text-text-primary">Complaint Details</h1>
              <StatusBadge status={complaint.status as ComplaintStatus} />
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Description</h3>
                <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">{complaint.raw_text}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Citizen</h3>
                  <p className="text-sm font-medium text-text-primary">
                    {(complaint.profiles as unknown as { full_name: string })?.full_name || "—"}
                  </p>
                </div>
                {complaint.category && (
                  <div>
                    <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Category</h3>
                    <p className="text-sm font-medium text-text-primary">{complaint.category}</p>
                  </div>
                )}
                {complaint.location_text && (
                  <div>
                    <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Location</h3>
                    <p className="text-sm font-medium text-text-primary">{complaint.location_text}</p>
                  </div>
                )}
                <div>
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Submitted</h3>
                  <p className="text-sm font-medium text-text-primary">
                    {new Date(complaint.created_at).toLocaleDateString("en-IN", {
                      day: "numeric", month: "long", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {complaint.image_url && (
                <div>
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Attached Image</h3>
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

          {/* ── Resolution Auditor (shown instead of / below status form) ── */}
          {resolveStep === "auditor" && (
            <ResolutionAuditorPanel
              complaint={complaint}
              onAuditComplete={(result) => {
                setAuditResult(result);
                setResolveStep("result");
              }}
              onCancel={() => setResolveStep("hidden")}
            />
          )}

          {resolveStep === "result" && auditResult && (
            <AuditResultPanel
              result={auditResult}
              beforeUrl={complaint.image_url ?? null}
              onConfirm={handleConfirmClose}
              onRetry={() => { setAuditResult(null); setResolveStep("auditor"); }}
              confirming={confirmingClose}
            />
          )}

          {/* Status update form (hidden while auditor is active) */}
          {resolveStep === "hidden" && (
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
                  {newStatus === "resolved" && (
                    <p className="text-xs text-violet-600 mt-1.5 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                      </svg>
                      AI Resolution Audit required — you'll upload an after photo
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="officer-update-note" className="block text-sm font-medium text-text-primary mb-1.5">
                    Note
                  </label>
                  <textarea
                    id="officer-update-note"
                    value={updateNote}
                    onChange={(e) => setUpdateNote(e.target.value)}
                    required={newStatus !== "resolved"}
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-raised text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder={newStatus === "resolved" ? "Optional note (resolution proof is required separately)..." : "Add a note about this status change..."}
                  />
                </div>

                <button
                  type="submit"
                  disabled={updating || (newStatus !== "resolved" && !updateNote.trim())}
                  className={`px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer ${newStatus === "resolved" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-violet-600 hover:bg-violet-700"}`}
                >
                  {updating
                    ? "Updating..."
                    : newStatus === "resolved"
                    ? "🔍 Begin AI Resolution Audit"
                    : "Update Status"}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-6">
          {/* Related Complaints */}
          {clusterComplaints.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Related Complaints
                <span className="ml-auto text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                  🔗 {clusterComplaints.length} in cluster
                </span>
              </h2>
              <div className="space-y-3">
                {clusterComplaints.map((c) => (
                  <a
                    key={c.id}
                    href={`/officer/${c.id}`}
                    className="block p-3 rounded-lg border border-border hover:border-violet-300 hover:bg-violet-50/40 transition-all group"
                  >
                    <p className="text-xs text-text-primary font-medium line-clamp-2 group-hover:text-violet-700 transition-colors">
                      {c.raw_text}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {c.priority && (
                        <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${c.priority === "high" ? "bg-red-100 text-red-700" : c.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                          {c.priority}
                        </span>
                      )}
                      {!c.is_duplicate && (
                        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-violet-100 text-violet-700">primary</span>
                      )}
                      <span className="text-[11px] text-text-muted">
                        {new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </a>
                ))}
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
                          day: "numeric", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
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
