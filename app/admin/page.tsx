import ComplaintsMapLoader from "@/components/admin/ComplaintsMapLoader";
import { createClient } from "@/lib/supabase/server";
import {
  getTotalComplaintCount,
  getComplaintCountByDepartment,
  getComplaintCountByStatus,
  getComplaintsForMap,
  getDepartmentPerformance,
} from "@/lib/queries/complaints";
import { DepartmentBarChart, StatusPieChart } from "@/components/admin/DashboardCharts";
import { DepartmentPerformanceTable } from "@/components/admin/DepartmentPerformanceTable";
import { SlaRecoveryCard } from "@/components/admin/SlaRecoveryCard";
import { RootCausePanel } from "@/components/admin/RootCausePanel";


export default async function AdminDashboard() {
  const supabase = await createClient();

  const [totalCount, deptCounts, statusCounts, mapPoints, deptPerformance] = await Promise.all([
    getTotalComplaintCount(supabase),
    getComplaintCountByDepartment(supabase),
    getComplaintCountByStatus(supabase),
    getComplaintsForMap(supabase),
    getDepartmentPerformance(supabase),
  ]);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
        <p className="text-sm text-text-secondary mt-1">
          Overview of all civic grievances across departments
        </p>
      </div>

      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 mb-8 shadow-lg shadow-emerald-100">
        <p className="text-emerald-100 text-sm font-medium">Total Complaints</p>
        <p className="text-4xl font-bold text-white mt-1">{totalCount}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-surface-raised">
            <h2 className="text-base font-bold text-text-primary">By Department</h2>
            <p className="text-xs text-text-muted mt-0.5">Complaint distribution across departments</p>
          </div>
          <div className="p-5">
            <DepartmentBarChart data={deptCounts} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-surface-raised">
            <h2 className="text-base font-bold text-text-primary">By Status</h2>
            <p className="text-xs text-text-muted mt-0.5">Current status distribution of all complaints</p>
          </div>
          <div className="p-5">
            <StatusPieChart data={statusCounts} />
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-surface-raised">
            <h2 className="text-base font-bold text-text-primary">Complaint Density Map</h2>
            <p className="text-xs text-text-muted mt-0.5">Geo-distribution of all reported issues</p>
          </div>
          <ComplaintsMapLoader points={mapPoints} />
        </div>
      </div>

      <div className="mb-8">
        <DepartmentPerformanceTable data={deptPerformance} />
      </div>

      <div className="mb-8">
        <SlaRecoveryCard data={deptPerformance} />
      </div>

      <div className="mb-8">
        <RootCausePanel />
      </div>
    </>
  );
}