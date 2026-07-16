import ComplaintsMapLoader from "@/components/admin/ComplaintsMapLoader";
import { createClient } from "@/lib/supabase/server";
import {
  getTotalComplaintCount,
  getComplaintCountByStatus,
  getComplaintsForMap,
} from "@/lib/queries/complaints";


export default async function AdminDashboard() {
  const supabase = await createClient();

  const [totalCount, statusCounts, mapPoints] = await Promise.all([
    getTotalComplaintCount(supabase),
    getComplaintCountByStatus(supabase),
    getComplaintsForMap(supabase),
  ]);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
        <p className="text-sm text-text-secondary mt-1">
          Overview of all civic grievances across departments
        </p>
      </div>

      {/* KPI Cards */}
      {(() => {
        const resolvedCount = statusCounts.find((s) => s.status === "resolved")?.count ?? 0;
        const pendingCount = totalCount - resolvedCount;
        const highPriorityCount = mapPoints.filter((p) => p.priority === "high").length;

        // Compute hotspot zones by bucketing coords into ~1km grid cells
        const zoneCounts = new Map<string, { count: number; lat: number; lng: number }>();
        for (const p of mapPoints) {
          const key = `${(p.latitude).toFixed(2)},${(p.longitude).toFixed(2)}`;
          const existing = zoneCounts.get(key);
          if (existing) {
            existing.count += 1;
          } else {
            zoneCounts.set(key, { count: 1, lat: p.latitude, lng: p.longitude });
          }
        }
        const hotspots = Array.from(zoneCounts.values()).filter((z) => z.count >= 3);
        const densestZone = hotspots.sort((a, b) => b.count - a.count)[0];
        const densestLabel = densestZone
          ? `${densestZone.lat.toFixed(3)}°N, ${densestZone.lng.toFixed(3)}°E`
          : "—";

        return (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 shadow-lg shadow-emerald-100">
                <p className="text-emerald-100 text-xs font-medium">Total Complaints</p>
                <p className="text-3xl font-bold text-white mt-1">{totalCount}</p>
              </div>
              <div className="bg-gradient-to-br from-sky-500 to-sky-600 rounded-2xl p-5 shadow-lg shadow-sky-100">
                <p className="text-sky-100 text-xs font-medium">Cases Resolved</p>
                <p className="text-3xl font-bold text-white mt-1">{resolvedCount}</p>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 shadow-lg shadow-amber-100">
                <p className="text-amber-100 text-xs font-medium">Cases Pending</p>
                <p className="text-3xl font-bold text-white mt-1">{pendingCount}</p>
              </div>
            </div>

            {/* Live Incident Overview */}
            <div className="bg-white rounded-xl border border-border overflow-hidden mb-6">
              <div className="px-5 py-3 border-b border-border bg-surface-raised">
                <h2 className="text-sm font-bold text-text-primary">Live Incident Overview</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
                <div className="px-5 py-4">
                  <p className="text-xs text-text-muted font-medium">Total Hotspots Detected</p>
                  <p className="text-xl font-bold text-text-primary mt-1">{hotspots.length}</p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-xs text-text-muted font-medium">Highest Density Area</p>
                  <p className="text-sm font-bold text-text-primary mt-1 truncate" title={densestLabel}>
                    {densestLabel}
                    {densestZone && (
                      <span className="ml-1.5 text-xs font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                        {densestZone.count} complaints
                      </span>
                    )}
                  </p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-xs text-text-muted font-medium">Active High Priority</p>
                  <p className="text-xl font-bold text-red-600 mt-1">{highPriorityCount}</p>
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* Complaint Density Map */}
      <div className="mb-8">
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-surface-raised">
            <h2 className="text-base font-bold text-text-primary">Complaint Density Map</h2>
            <p className="text-xs text-text-muted mt-0.5">Geo-distribution of all reported issues</p>
          </div>
          <ComplaintsMapLoader points={mapPoints} />
        </div>
      </div>
    </>
  );
}