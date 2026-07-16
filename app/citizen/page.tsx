import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { getCitizenComplaints } from "@/lib/queries/complaints";
import StatusBadge from "@/components/StatusBadge";
import DuplicateBanner from "@/components/DuplicateBanner";
import type { ComplaintStatus } from "@/lib/types";
import { Search, Plus, FileText } from "lucide-react";

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

      {/* Greeting Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xl text-[#78716C] font-normal">Hello,</p>
          <h1 className="text-4xl font-extrabold text-[#B45309] leading-tight">{firstName}</h1>
        </div>
        <Link
          href="/citizen/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#B45309] text-white text-sm font-semibold hover:bg-[#92400E] transition-all shadow-md active:scale-[0.99] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Complaint
        </Link>
      </div>

      {/* Search Card */}
      <div className="bg-white rounded-2xl border border-[#E7E0D8] shadow-sm p-4 mb-8">
        <div className="flex items-center gap-3 px-2">
          <Search className="w-4 h-4 text-[#A8A29E] shrink-0" />
          <span className="text-sm text-[#A8A29E]">Search complaints, categories, or status...</span>
        </div>
      </div>

      {/* Complaints list */}
      {complaints.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-[#FAF5EE] border border-[#E7E0D8] flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-[#B45309]" />
          </div>
          <h3 className="text-lg font-semibold text-[#1C1917] mb-1">
            No complaints yet
          </h3>
          <p className="text-sm text-[#78716C] mb-6">
            Submit your first complaint to get started
          </p>
          <Link
            href="/citizen/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#B45309] text-white text-sm font-semibold hover:bg-[#92400E] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Submit a Complaint
          </Link>
        </div>
      ) : (
        <>
          {/* Section label */}
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-5 rounded-full bg-[#B45309]" />
            <h2 className="text-base font-bold text-[#1C1917]">Recent Complaints</h2>
          </div>

          <div className="space-y-3">
            {complaints.map((complaint) => (
              <Link
                key={complaint.id}
                href={`/citizen/${complaint.id}`}
                className="block bg-white rounded-xl border border-[#E7E0D8] p-5 hover:border-[#B45309]/40 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1C1917] line-clamp-2 group-hover:text-[#B45309] transition-colors">
                      {complaint.raw_text}
                    </p>
                    <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                      {complaint.category && (
                        <span className="text-xs font-medium text-[#78716C] bg-[#FAF5EE] border border-[#E7E0D8] px-2 py-0.5 rounded-md">
                          {complaint.category}
                        </span>
                      )}
                      {complaint.cluster_id && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                          🔗 Clustered
                        </span>
                      )}
                      <span className="text-xs text-[#A8A29E]">
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
