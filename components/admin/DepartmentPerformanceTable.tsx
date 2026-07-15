import type { DepartmentPerformance } from "@/lib/queries/complaints";

export function DepartmentPerformanceTable({ data }: { data: DepartmentPerformance[] }) {
    return (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-surface-raised">
                <h2 className="text-base font-bold text-text-primary">Department Performance</h2>
                <p className="text-xs text-text-muted mt-0.5">Resolution rate and SLA compliance (72hr target)</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Department</th>
                            <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Total</th>
                            <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Resolved</th>
                            <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Avg Time</th>
                            <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">SLA %</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-5 py-8 text-center text-sm text-text-muted">No data available</td>
                            </tr>
                        ) : (
                            data.map((row) => (
                                <tr key={row.department_name} className="border-b border-border last:border-0">
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