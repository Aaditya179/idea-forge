import ComplaintsMapLoader from "@/components/admin/ComplaintsMapLoader";
import { createClient } from "@/lib/supabase/server";
import {
  getTotalComplaintCount,
  getComplaintCountByStatus,
  getComplaintsForMap,
} from "@/lib/queries/complaints";
import { Shield } from "lucide-react";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [totalCount, statusCounts, mapPoints] = await Promise.all([
    getTotalComplaintCount(supabase),
    getComplaintCountByStatus(supabase),
    getComplaintsForMap(supabase),
  ]);

  return (
    <>
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#fbefe3] border border-[#f6ddc4] text-[#c86d28] text-xs font-semibold mb-3 shadow-sm">
          <Shield className="w-3.5 h-3.5 text-[#c86d28]" />
          <span>Municipal Executive Command Center</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#1c1917]">Admin Dashboard</h1>
        <p className="text-base text-[#4a423a] mt-1.5">
          Comprehensive oversight and analytics of civic grievances across all municipal departments
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl border border-[#e6dfd3] p-6 shadow-sm hover:border-[#c86d28] transition-all">
                <p className="text-xs font-mono font-bold text-[#7a6f64] uppercase tracking-wider mb-1.5">Total Grievances</p>
                <p className="text-4xl sm:text-5xl font-bold tracking-tight text-[#1c1917]">{totalCount}</p>
              </div>
              <div className="bg-white rounded-2xl border border-[#e6dfd3] p-6 shadow-sm hover:border-[#c86d28] transition-all">
                <p className="text-xs font-mono font-bold text-[#7a6f64] uppercase tracking-wider mb-1.5">Cases Resolved</p>
                <p className="text-4xl sm:text-5xl font-bold tracking-tight text-[#1e6f43]">{resolvedCount}</p>
              </div>
              <div className="bg-white rounded-2xl border border-[#e6dfd3] p-6 shadow-sm hover:border-[#c86d28] transition-all">
                <p className="text-xs font-mono font-bold text-[#7a6f64] uppercase tracking-wider mb-1.5">Cases Pending</p>
                <p className="text-4xl sm:text-5xl font-bold tracking-tight text-[#c86d28]">{pendingCount}</p>
              </div>
            </div>

            {/* Live Incident Overview */}
            <div className="bg-white rounded-2xl border border-[#e6dfd3] overflow-hidden mb-8 shadow-sm">
              <div className="px-6 py-4 border-b border-[#e6dfd3] bg-[#faf6f0]">
                <h2 className="text-xl font-bold tracking-tight text-[#1c1917]">Live Incident Overview</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#e6dfd3]">
                <div className="px-6 py-5">
                  <p className="text-xs font-mono font-bold text-[#7a6f64] uppercase tracking-wider">Total Hotspots Detected</p>
                  <p className="text-3xl font-bold tracking-tight text-[#1c1917] mt-1.5">{hotspots.length}</p>
                </div>
                <div className="px-6 py-5">
                  <p className="text-xs font-mono font-bold text-[#7a6f64] uppercase tracking-wider">Highest Density Area</p>
                  <p className="text-base font-bold text-[#1c1917] mt-1.5 truncate" title={densestLabel}>
                    {densestLabel}
                    {densestZone && (
                      <span className="ml-2 text-xs font-mono font-bold text-[#9e3333] bg-[#fde8e8] border border-red-200 px-2 py-0.5 rounded-full">
                        {densestZone.count} cases
                      </span>
                    )}
                  </p>
                </div>
                <div className="px-6 py-5">
                  <p className="text-xs font-mono font-bold text-[#7a6f64] uppercase tracking-wider">Active High Priority</p>
                  <p className="text-3xl font-bold tracking-tight text-[#9e3333] mt-1.5">{highPriorityCount}</p>
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* Complaint Density Map */}
      <div className="mb-10">
        <div className="bg-white rounded-2xl border border-[#e6dfd3] overflow-hidden shadow-sm">
          <div className="px-6 py-4.5 border-b border-[#e6dfd3] bg-[#faf6f0] flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#1c1917]">Complaint Density Map</h2>
              <p className="text-xs font-mono text-[#7a6f64] mt-0.5">Geo-spatial distribution of all reported municipal issues</p>
            </div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-[#fbefe3] text-[#c86d28] border border-[#f6ddc4]">
              City-Wide GIS
            </span>
          </div>
          <ComplaintsMapLoader points={mapPoints} />
        </div>
      </div>
    </>
  );
}