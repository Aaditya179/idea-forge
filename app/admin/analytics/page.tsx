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
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#1c1917]">Analytics</h1>
        <p className="text-base text-[#4a423a] mt-1.5">
          Complaint distribution and department performance metrics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-2xl border border-[#e6dfd3] overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[#e6dfd3] bg-[#faf6f0]">
            <h2 className="text-xl font-bold tracking-tight text-[#1c1917]">By Department</h2>
            <p className="text-xs font-mono text-[#7a6f64] mt-0.5">Complaint distribution across departments</p>
          </div>
          <div className="p-6">
            <DepartmentBarChart data={deptCounts} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e6dfd3] overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[#e6dfd3] bg-[#faf6f0]">
            <h2 className="text-xl font-bold tracking-tight text-[#1c1917]">By Status</h2>
            <p className="text-xs font-mono text-[#7a6f64] mt-0.5">Current status distribution of all complaints</p>
          </div>
          <div className="p-6">
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
