import type { DepartmentPerformance } from "@/lib/queries/complaints";

export function DepartmentPerformanceTable({ data }: { data: DepartmentPerformance[] }) {
    return (
        <div className="bg-white rounded-2xl border border-[#e6dfd3] overflow-hidden shadow-sm">
            <div className="px-6 py-4.5 border-b border-[#e6dfd3] bg-[#faf6f0]">
                <h2 className="text-xl font-bold tracking-tight text-[#1c1917]">Department Performance</h2>
                <p className="text-xs font-mono text-[#7a6f64] mt-0.5">Resolution rate and SLA compliance (72hr target)</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[#e6dfd3] bg-[#faf6f0]">
                            <th className="text-left text-xs font-mono font-bold text-[#7a6f64] uppercase tracking-wider px-5 py-3.5">Department</th>
                            <th className="text-right text-xs font-mono font-bold text-[#7a6f64] uppercase tracking-wider px-5 py-3.5">Total</th>
                            <th className="text-right text-xs font-mono font-bold text-[#7a6f64] uppercase tracking-wider px-5 py-3.5">Resolved</th>
                            <th className="text-right text-xs font-mono font-bold text-[#7a6f64] uppercase tracking-wider px-5 py-3.5">Avg Time</th>
                            <th className="text-right text-xs font-mono font-bold text-[#7a6f64] uppercase tracking-wider px-5 py-3.5">SLA %</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-5 py-8 text-center text-sm text-text-muted">No data available</td>
                            </tr>
                        ) : (
                            data.map((row) => (
                                <tr key={row.department_name} className="border-b border-[#e6dfd3] last:border-0 hover:bg-[#faf6f0] transition-colors">
                                    <td className="px-5 py-3 text-sm font-medium text-text-primary">{row.department_name}</td>
                                    <td className="px-5 py-3 text-sm text-text-secondary text-right">{row.total}</td>
                                    <td className="px-5 py-3 text-sm text-text-secondary text-right">
                                        {row.resolved} <span className="text-text-muted">({row.resolutionRate}%)</span>
                                    </td>
                                    <td className="px-5 py-3 text-sm text-text-secondary text-right">
                                        {row.avgResolutionHours !== null ? `${row.avgResolutionHours}h` : "—"}
                                    </td>
                                    <td className="px-5 py-3 text-sm text-right font-semibold">
                                        <span className={row.slaPercent >= 80 ? "text-emerald-600" : row.slaPercent >= 50 ? "text-amber-600" : "text-red-600"}>
                                            {row.resolved > 0 ? `${row.slaPercent}%` : "—"}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}