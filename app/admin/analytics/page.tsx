import { createClient } from "@/lib/supabase/server";
import {
  getComplaintCountByDepartment,
  getComplaintCountByStatus,
  getDepartmentPerformance,
} from "@/lib/queries/complaints";
import { DepartmentBarChart, StatusPieChart } from "@/components/admin/DashboardCharts";
import { DepartmentPerformanceTable } from "@/components/admin/DepartmentPerformanceTable";


export default async function AnalyticsPage() {
  const supabase = await createClient();

  const [deptCounts, statusCounts, deptPerformance] = await Promise.all([
    getComplaintCountByDepartment(supabase),
    getComplaintCountByStatus(supabase),
    getDepartmentPerformance(supabase),
  ]);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
        <p className="text-sm text-text-secondary mt-1">
          Complaint distribution and department performance metrics
        </p>
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
        <DepartmentPerformanceTable data={deptPerformance} />
      </div>
    </>
  );
}
