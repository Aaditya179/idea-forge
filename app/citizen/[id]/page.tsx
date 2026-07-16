import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getComplaintById, getComplaintUpdates } from "@/lib/queries/complaints";
import StatusBadge from "@/components/StatusBadge";
import type { ComplaintStatus } from "@/lib/types";
import { ArrowLeft, MapPin, Tag, Building2, Calendar, Image as ImageIcon, Sparkles, CheckCircle2 } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

// ── Helper: extract verified after-image URL from an update note ──────────────
function extractAfterImageUrl(note: string): string | null {
  const match = note.match(/\[AFTER_IMAGE:(https?:\/\/[^\]]+)\]/);
  return match?.[1] ?? null;
}

// ── Helper: strip the marker from the displayed note text ─────────────────────
function cleanNote(note: string): string {
  return note.replace(/\s*\[AFTER_IMAGE:https?:\/\/[^\]]+\]/g, "").trim();
}

export default async function CitizenComplaintDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const complaint = await getComplaintById(supabase, id);
  if (!complaint) notFound();

  const updates = await getComplaintUpdates(supabase, id);

  // Find the AI-verified resolution update (contains the marker)
  const resolvedUpdate = updates.find(
    (u) => u.status_at_time === "resolved" && u.note.includes("[AFTER_IMAGE:")
  );
  const afterImageUrl = resolvedUpdate ? extractAfterImageUrl(resolvedUpdate.note) : null;
  const isVerifiedResolution = complaint.status === "resolved" && afterImageUrl !== null;

  return (
    <>
      {/* Back link */}
      <Link
        href="/citizen"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#4a423a] hover:text-[#c86d28] mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
        <span>Back to My Complaints</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Main column ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-8">

          {/* ── AI-Verified Resolution Certificate (only if passed audit) ── */}
          {isVerifiedResolution && (
            <div className="rounded-2xl border border-[#1e6f43]/30 bg-white overflow-hidden shadow-sm">
              {/* Header */}
              <div className="px-6 py-5 bg-[#e6f4ea] border-b border-[#1e6f43]/20 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-white border border-[#1e6f43]/20 flex items-center justify-center text-xl shadow-sm shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-[#1e6f43]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1e6f43]">Issue Resolved — AI Verified Certificate</h2>
                  <p className="text-xs text-[#4a423a] mt-0.5 leading-relaxed">
                    A municipal engineer completed the field repair and submitted photographic proof. Our autonomous AI auditor independently verified the fix.
                  </p>
                </div>
                <span className="ml-auto shrink-0 px-3 py-1 rounded-full bg-white border border-[#1e6f43]/30 text-xs font-bold uppercase tracking-wider text-[#1e6f43] shadow-sm">
                  Verified ✓
                </span>
              </div>

              {/* Photo comparison */}
              <div className="p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-[#7a6f64] font-mono mb-4">Resolution Proof Verification</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Before */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#7a6f64]">Before (Initial Submission)</p>
                    {complaint.image_url ? (
                      <img
                        src={complaint.image_url}
                        alt="Original complaint"
                        className="w-full h-48 object-cover rounded-xl border border-[#e6dfd3] shadow-sm"
                      />
                    ) : (
                      <div className="w-full h-48 rounded-xl border border-dashed border-[#e6dfd3] bg-[#faf6f0] flex items-center justify-center">
                        <p className="text-xs text-[#7a6f64] text-center px-4 font-mono">No photo attached<br />to original report</p>
                      </div>
                    )}
                  </div>

                  {/* After — AI verified */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#1e6f43]">After (Field Resolution)</p>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#e6f4ea] text-[#1e6f43]">
                        AI Verified ✓
                      </span>
                    </div>
                    <div className="relative">
                      <img
                        src={afterImageUrl!}
                        alt="Resolution proof"
                        className="w-full h-48 object-cover rounded-xl border-2 border-[#1e6f43]/40 shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* AI audit trail excerpt */}
                {resolvedUpdate && (
                  <div className="mt-6 rounded-xl border border-[#e6dfd3] bg-[#faf6f0] p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Sparkles className="w-4 h-4 text-[#c86d28]" />
                      <p className="text-xs font-bold uppercase tracking-wider text-[#1c1917] font-mono">AI Auditor Verdict</p>
                    </div>
                    <p className="text-sm text-[#4a423a] leading-relaxed">
                      {cleanNote(resolvedUpdate.note)}
                    </p>
                    <p className="text-xs font-mono text-[#7a6f64] mt-2">
                      Closed on{" "}
                      {new Date(resolvedUpdate.created_at).toLocaleDateString("en-IN", {
                        day: "numeric", month: "long", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Standard resolved state (no after photo) ── */}
          {complaint.status === "resolved" && !isVerifiedResolution && (
            <div className="rounded-2xl border border-[#1e6f43]/30 bg-[#e6f4ea] p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#1e6f43]/20 flex items-center justify-center text-[#1e6f43] shrink-0">
                <CheckCircle2 className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <p className="text-base font-bold text-[#1e6f43]">Issue Resolved</p>
                <p className="text-sm text-[#4a423a] mt-0.5 leading-relaxed">This complaint has been verified and marked as resolved by the assigned municipal officer.</p>
              </div>
            </div>
          )}

          {/* Complaint details card */}
          <div className="bg-white rounded-2xl border border-[#e6dfd3] p-6 sm:p-8 shadow-sm">
            <div className="flex items-start justify-between gap-4 pb-6 border-b border-[#e6dfd3] mb-6">
              <div>
                <span className="text-xs font-mono text-[#7a6f64] uppercase tracking-wider block mb-1">
                  Grievance Record
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1c1917]">Complaint Details</h1>
              </div>
              <StatusBadge status={complaint.status as ComplaintStatus} />
            </div>

            <div className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-xs font-mono font-bold text-[#7a6f64] uppercase tracking-wider mb-2">Description</h3>
                <p className="text-base text-[#1c1917] leading-relaxed whitespace-pre-wrap">{complaint.raw_text}</p>
              </div>

              {/* Metadata grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-[#e6dfd3]">
                {complaint.category && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#fbefe3] border border-[#f6ddc4] flex items-center justify-center text-[#c86d28] shrink-0 mt-0.5">
                      <Tag className="w-4 h-4 stroke-[2]" />
                    </div>
                    <div>
                      <h3 className="text-xs font-mono font-bold text-[#7a6f64] uppercase tracking-wider mb-1">Category</h3>
                      <p className="text-sm font-semibold text-[#1c1917]">{complaint.category}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#fbefe3] border border-[#f6ddc4] flex items-center justify-center text-[#c86d28] shrink-0 mt-0.5">
                    <Building2 className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold text-[#7a6f64] uppercase tracking-wider mb-1">Assigned Department</h3>
                    <p className="text-sm font-semibold text-[#1c1917]">
                      {(complaint.departments as unknown as { name: string })?.name || "—"}
                    </p>
                  </div>
                </div>
                {complaint.location_text && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#fbefe3] border border-[#f6ddc4] flex items-center justify-center text-[#c86d28] shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 stroke-[2]" />
                    </div>
                    <div>
                      <h3 className="text-xs font-mono font-bold text-[#7a6f64] uppercase tracking-wider mb-1">Location</h3>
                      <p className="text-sm font-semibold text-[#1c1917]">{complaint.location_text}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#fbefe3] border border-[#f6ddc4] flex items-center justify-center text-[#c86d28] shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold text-[#7a6f64] uppercase tracking-wider mb-1">Submitted Timestamp</h3>
                    <p className="text-sm font-semibold text-[#1c1917]">
                      {new Date(complaint.created_at).toLocaleDateString("en-IN", {
                        day: "numeric", month: "long", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {complaint.image_url && (
                <div className="pt-6 border-t border-[#e6dfd3]">
                  <div className="flex items-center gap-2 mb-3">
                    <ImageIcon className="w-4 h-4 text-[#c86d28]" />
                    <h3 className="text-xs font-mono font-bold text-[#7a6f64] uppercase tracking-wider">Your Attached Photo</h3>
                  </div>
                  <img
                    src={complaint.image_url}
                    alt="Complaint attachment"
                    className="rounded-xl border border-[#e6dfd3] max-h-80 object-cover shadow-sm"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Timeline sidebar ──────────────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-[#e6dfd3] p-6 sm:p-8 shadow-sm">
            <h2 className="text-2xl font-bold tracking-tight text-[#1c1917] pb-4 border-b border-[#e6dfd3] mb-6">Audit Timeline</h2>

            {updates.length === 0 ? (
              <p className="text-sm text-[#7a6f64] font-mono">No status updates yet.</p>
            ) : (
              <div className="space-y-0 relative">
                {updates.map((update, idx) => {
                  const isResolutionUpdate = update.status_at_time === "resolved" && update.note.includes("[AFTER_IMAGE:");
                  const displayNote = cleanNote(update.note);

                  return (
                    <div key={update.id} className="relative flex gap-4">
                      {idx < updates.length - 1 && (
                        <div className="absolute left-[9px] top-6 bottom-0 w-0.5 bg-[#e6dfd3]" />
                      )}
                      <div className="relative z-10 mt-1.5 w-5 flex-shrink-0 flex items-start justify-center">
                        <div className={`w-4 h-4 rounded-full ring-4 ${isResolutionUpdate ? "bg-[#1e6f43] ring-[#e6f4ea]" : "bg-[#c86d28] ring-[#fbefe3]"}`} />
                      </div>
                      <div className="pb-8 flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1c1917] leading-relaxed">{displayNote}</p>
                        {isResolutionUpdate && (
                          <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold uppercase tracking-wider text-[#1e6f43] bg-[#e6f4ea] border border-[#1e6f43]/20 px-2.5 py-0.5 rounded-full">
                            ✓ AI Verified Resolution
                          </span>
                        )}
                        <div className="flex items-center gap-2 mt-2.5">
                          <StatusBadge status={update.status_at_time as ComplaintStatus} />
                        </div>
                        <p className="text-xs font-mono text-[#7a6f64] mt-2">
                          {new Date(update.created_at).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
