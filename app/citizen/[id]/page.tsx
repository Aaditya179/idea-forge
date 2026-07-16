import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getComplaintById, getComplaintUpdates } from "@/lib/queries/complaints";
import StatusBadge from "@/components/StatusBadge";
import type { ComplaintStatus } from "@/lib/types";
import { ArrowLeft, MapPin, Tag, Building2, Calendar, Image as ImageIcon } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

// ── Helper: extract verified after-image URL from an update note ──────────────
// The officer page embeds [AFTER_IMAGE:url] when AI audit passes.
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
        className="inline-flex items-center gap-1.5 text-sm text-[#78716C] hover:text-[#B45309] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Complaints
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Main column ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── AI-Verified Resolution Certificate (only if passed audit) ── */}
          {isVerifiedResolution && (
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white overflow-hidden shadow-sm">
              {/* Header */}
              <div className="px-6 py-4 border-b border-emerald-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-xl">
                  ✅
                </div>
                <div>
                  <h2 className="text-base font-bold text-emerald-800">Issue Resolved — AI Verified</h2>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    A government officer completed the repair and submitted photographic proof. Our AI auditor independently verified the fix.
                  </p>
                </div>
                <span className="ml-auto shrink-0 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Verified ✓
                </span>
              </div>

              {/* Photo comparison */}
              <div className="p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#A8A29E] mb-3">Resolution Proof</p>
                <div className="grid grid-cols-2 gap-4">
                  {/* Before */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#A8A29E]">Before</p>
                    {complaint.image_url ? (
                      <img
                        src={complaint.image_url}
                        alt="Original complaint"
                        className="w-full h-44 object-cover rounded-xl border border-[#E7E0D8]"
                      />
                    ) : (
                      <div className="w-full h-44 rounded-xl border border-dashed border-[#E7E0D8] bg-[#FAF5EE] flex items-center justify-center">
                        <p className="text-xs text-[#A8A29E] text-center px-4">No photo attached<br />to original complaint</p>
                      </div>
                    )}
                  </div>

                  {/* After — AI verified */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">After — AI Verified</p>
                    </div>
                    <div className="relative">
                      <img
                        src={afterImageUrl!}
                        alt="Resolution proof"
                        className="w-full h-44 object-cover rounded-xl border border-emerald-300 shadow-sm"
                      />
                      {/* Verified watermark badge */}
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
                        ✓ AI Verified
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI audit trail excerpt */}
                {resolvedUpdate && (
                  <div className="mt-4 rounded-xl border border-emerald-100 bg-white px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#A8A29E] mb-1">AI Auditor Verdict</p>
                    <p className="text-sm text-[#78716C] leading-relaxed">
                      {cleanNote(resolvedUpdate.note)}
                    </p>
                    <p className="text-xs text-[#A8A29E] mt-1.5">
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
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4 flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-sm font-bold text-emerald-800">Issue Resolved</p>
                <p className="text-xs text-emerald-600 mt-0.5">This complaint has been marked as resolved by the assigned officer.</p>
              </div>
            </div>
          )}

          {/* Complaint details card */}
          <div className="bg-white rounded-2xl border border-[#E7E0D8] p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-6">
              <h1 className="text-xl font-bold text-[#1C1917]">Complaint Details</h1>
              <StatusBadge status={complaint.status as ComplaintStatus} />
            </div>

            <div className="space-y-5">
              {/* Description */}
              <div>
                <h3 className="text-xs font-semibold text-[#A8A29E] uppercase tracking-wider mb-2">Description</h3>
                <p className="text-sm text-[#1C1917] leading-relaxed whitespace-pre-wrap">{complaint.raw_text}</p>
              </div>

              {/* Metadata grid */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#E7E0D8]">
                {complaint.category && (
                  <div className="flex items-start gap-2">
                    <Tag className="w-4 h-4 text-[#B45309] mt-0.5 shrink-0" />
                    <div>
                      <h3 className="text-xs font-semibold text-[#A8A29E] uppercase tracking-wider mb-1">Category</h3>
                      <p className="text-sm font-medium text-[#1C1917]">{complaint.category}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-[#B45309] mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-xs font-semibold text-[#A8A29E] uppercase tracking-wider mb-1">Department</h3>
                    <p className="text-sm font-medium text-[#1C1917]">
                      {(complaint.departments as unknown as { name: string })?.name || "—"}
                    </p>
                  </div>
                </div>
                {complaint.location_text && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#B45309] mt-0.5 shrink-0" />
                    <div>
                      <h3 className="text-xs font-semibold text-[#A8A29E] uppercase tracking-wider mb-1">Location</h3>
                      <p className="text-sm font-medium text-[#1C1917]">{complaint.location_text}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-[#B45309] mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-xs font-semibold text-[#A8A29E] uppercase tracking-wider mb-1">Submitted</h3>
                    <p className="text-sm font-medium text-[#1C1917]">
                      {new Date(complaint.created_at).toLocaleDateString("en-IN", {
                        day: "numeric", month: "long", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {complaint.image_url && (
                <div className="pt-4 border-t border-[#E7E0D8]">
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon className="w-4 h-4 text-[#B45309]" />
                    <h3 className="text-xs font-semibold text-[#A8A29E] uppercase tracking-wider">Your Attached Photo</h3>
                  </div>
                  <img
                    src={complaint.image_url}
                    alt="Complaint attachment"
                    className="rounded-xl border border-[#E7E0D8] max-h-64 object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Timeline sidebar ──────────────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-[#E7E0D8] p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#1C1917] mb-5">Timeline</h2>

            {updates.length === 0 ? (
              <p className="text-sm text-[#A8A29E]">No updates yet.</p>
            ) : (
              <div className="space-y-0">
                {updates.map((update, idx) => {
                  const isResolutionUpdate = update.status_at_time === "resolved" && update.note.includes("[AFTER_IMAGE:");
                  const displayNote = cleanNote(update.note);

                  return (
                    <div key={update.id} className="relative flex gap-3">
                      {idx < updates.length - 1 && (
                        <div className="absolute left-[7px] top-5 bottom-0 w-px bg-[#E7E0D8]" />
                      )}
                      <div className="relative z-10 mt-1.5 w-[15px] flex-shrink-0 flex items-start justify-center">
                        <div className={`w-3.5 h-3.5 rounded-full ring-2 ${isResolutionUpdate ? "bg-emerald-500 ring-emerald-100" : "bg-[#B45309] ring-[#FFFBEB]"}`} />
                      </div>
                      <div className="pb-6 flex-1">
                        <p className="text-sm font-medium text-[#1C1917]">{displayNote}</p>
                        {isResolutionUpdate && (
                          <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            ✓ AI Verified Resolution
                          </span>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <StatusBadge status={update.status_at_time as ComplaintStatus} />
                        </div>
                        <p className="text-xs text-[#A8A29E] mt-1.5">
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
