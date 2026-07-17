import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { getCitizenComplaints } from "@/lib/queries/complaints";
import StatusBadge from "@/components/StatusBadge";
import DuplicateBanner from "@/components/DuplicateBanner";
import NewComplaintButton from "@/components/citizen/NewComplaintButton";
import type { ComplaintStatus } from "@/lib/types";
import { Search, Plus, FileText, Sparkles } from "lucide-react";
import { getReferenceNumber } from "@/lib/utils/referenceNumber";

export default async function CitizenDashboard() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) return null;

  const complaints = await getCitizenComplaints(supabase, profile.id);
  const firstName = profile.full_name?.split(" ")[0] ?? "Citizen";

  return (
    <>
      {/* Post-submission duplicate banner — reads ?similar=N from URL */}
      <Suspense fallback={null}>
        <DuplicateBanner />
      </Suspense>

      {/* Greeting Header matching exact Section 1 / Hero pill & serif typography */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#fbefe3] border border-[#f6ddc4] text-[#c86d28] text-xs font-semibold mb-3 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#c86d28]" />
            <span>Citizen Portal</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#1c1917]">
            Hello, <span className="text-[#c86d28]">{firstName}</span>
          </h1>
        </div>
        <NewComplaintButton className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-[#c86d28] text-white hover:bg-[#b35c1e] transition-all shadow-sm hover:shadow-orange-900/20 active:scale-95 cursor-pointer shrink-0">
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Complaint</span>
        </NewComplaintButton>
      </div>

      {/* Search Card */}
      <div className="bg-white rounded-2xl border border-[#e6dfd3] shadow-sm p-4.5 mb-10">
        <div className="flex items-center gap-3 px-2">
          <Search className="w-4 h-4 text-[#7a6f64] shrink-0" />
          <span className="text-sm text-[#7a6f64] font-medium">Search complaints, categories, or status...</span>
        </div>
      </div>

      {/* Complaints list */}
      {complaints.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-[#e6dfd3] p-8 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#fbefe3] border border-[#f6ddc4] flex items-center justify-center mx-auto mb-5 shadow-sm">
            <FileText className="w-7 h-7 text-[#c86d28]" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-[#1c1917] mb-2">
            No complaints yet
          </h3>
          <p className="text-base text-[#4a423a] mb-8 max-w-md mx-auto">
            Submit your first complaint to get instant, accurate municipal routing and live SLA tracking.
          </p>
          <NewComplaintButton className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[#c86d28] text-white text-sm font-semibold hover:bg-[#b35c1e] transition-all shadow-sm hover:shadow-orange-900/20 active:scale-95 cursor-pointer">
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Submit a Complaint</span>
          </NewComplaintButton>
        </div>
      ) : (
        <>
          {/* Section label */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-6 rounded-full bg-[#c86d28]" />
              <h2 className="text-lg font-bold text-[#1c1917] tracking-tight">Recent Complaints</h2>
            </div>
            <span className="text-xs font-mono text-[#7a6f64] uppercase tracking-wider">
              Total: {complaints.length}
            </span>
          </div>

          <div className="space-y-4">
            {complaints.map((complaint) => (
              <Link
                key={complaint.id}
                href={`/citizen/${complaint.id}`}
                className="block bg-white rounded-2xl border border-[#e6dfd3] p-6 hover:border-[#c86d28] hover:shadow-md transition-all group relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2.5">
                    <p className="text-base font-bold text-[#1c1917] leading-snug line-clamp-2 group-hover:text-[#c86d28] transition-colors">
                      {complaint.raw_text}
                    </p>
                    <div className="flex items-center gap-2.5 flex-wrap pt-1">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold text-[#c86d28] bg-[#fdf8f4] border border-[#f3ded0]">
                        Reference: {getReferenceNumber(complaint.id)}
                      </span>
                      {complaint.category && (
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold text-[#4a423a] bg-[#faf6f0] border border-[#e6dfd3]">
                          {complaint.category}
                        </span>
                      )}
                      {complaint.cluster_id && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#e8f1f8] text-[#2f5a82] border border-[#b8d4ea]">
                          🔗 Clustered
                        </span>
                      )}
                      <span className="text-xs font-mono text-[#7a6f64]">
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
        </>
      )}
    </>
  );
}
