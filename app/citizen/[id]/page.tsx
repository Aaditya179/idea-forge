import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getComplaintById, getComplaintUpdates } from "@/lib/queries/complaints";
import StatusBadge from "@/components/StatusBadge";
import type { ComplaintStatus } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CitizenComplaintDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const complaint = await getComplaintById(supabase, id);
  if (!complaint) {
    notFound();
  }

  const updates = await getComplaintUpdates(supabase, id);

  return (
    <>
      {/* Back link */}
      <Link
        href="/citizen"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary-600 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to My Complaints
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Complaint details card */}
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-xl font-bold text-text-primary">
                Complaint Details
              </h1>
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
                {complaint.category && (
                  <div>
                    <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                      Category
                    </h3>
                    <p className="text-sm font-medium text-text-primary">{complaint.category}</p>
                  </div>
                )}
                <div>
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                    Department
                  </h3>
                  <p className="text-sm font-medium text-text-primary">
                    {(complaint.departments as unknown as { name: string })?.name || "—"}
                  </p>
                </div>
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
                    {/* Vertical line */}
                    {idx < updates.length - 1 && (
                      <div className="absolute left-[7px] top-5 bottom-0 w-px bg-border" />
                    )}
                    {/* Dot */}
                    <div className="relative z-10 mt-1.5 w-[15px] flex-shrink-0 flex items-start justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary-500 ring-2 ring-primary-100" />
                    </div>
                    {/* Content */}
                    <div className="pb-6 flex-1">
                      <p className="text-sm font-medium text-text-primary">{update.note}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={update.status_at_time as ComplaintStatus} />
                      </div>
                      <p className="text-xs text-text-muted mt-1.5">
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
