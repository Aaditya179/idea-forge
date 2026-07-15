import { createClient } from "@/lib/supabase/server";
import {
  getTotalComplaintCount,
  getComplaintCountByDepartment,
  getComplaintCountByStatus,
} from "@/lib/queries/complaints";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [totalCount, deptCounts, statusCounts] = await Promise.all([
    getTotalComplaintCount(supabase),
    getComplaintCountByDepartment(supabase),
    getComplaintCountByStatus(supabase),
  ]);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
        <p className="text-sm text-text-secondary mt-1">
          Overview of all civic grievances across departments
        </p>
      </div>

      {/* Total count card */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 mb-8 shadow-lg shadow-emerald-100">
        <p className="text-emerald-100 text-sm font-medium">Total Complaints</p>
        <p className="text-4xl font-bold text-white mt-1">{totalCount}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* By department */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-surface-raised">
            <h2 className="text-base font-bold text-text-primary">By Department</h2>
            <p className="text-xs text-text-muted mt-0.5">Complaint distribution across departments</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">
                    Department
                  </th>
                  <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">
                    Count
                  </th>
                </tr>
              </thead>
              <tbody>
                {deptCounts.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-5 py-8 text-center text-sm text-text-muted">
                      No data available
                    </td>
                  </tr>
                ) : (
                  deptCounts.map((row) => (
                    <tr key={row.department_name} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 text-sm font-medium text-text-primary">
                        {row.department_name}
                      </td>
                      <td className="px-5 py-3 text-sm text-text-secondary text-right font-semibold">
                        {row.count}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* By status */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-surface-raised">
            <h2 className="text-base font-bold text-text-primary">By Status</h2>
            <p className="text-xs text-text-muted mt-0.5">Current status distribution of all complaints</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">
                    Status
                  </th>
                  <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">
                    Count
                  </th>
                </tr>
              </thead>
              <tbody>
                {statusCounts.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-5 py-8 text-center text-sm text-text-muted">
                      No data available
                    </td>
                  </tr>
                ) : (
                  statusCounts.map((row) => (
                    <tr key={row.status} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 text-sm font-medium text-text-primary capitalize">
                        {row.status.replace("_", " ")}
                      </td>
                      <td className="px-5 py-3 text-sm text-text-secondary text-right font-semibold">
                        {row.count}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
