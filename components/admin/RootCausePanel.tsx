"use client";

import { useEffect, useState } from "react";

interface RootCauseResult {
    cluster_index: number;
    root_cause: string;
    suggested_fix: string;
    estimated_impact: string;
    department: string;
    location_zone: string;
    count: number;
}

interface ApiResponse {
    rootCauses: RootCauseResult[];
    totalClustered: number;
}

// Severity thresholds
function getSeverity(count: number): "high" | "medium" | "low" {
    if (count >= 7) return "high";
    if (count >= 4) return "medium";
    return "low";
}

const SEVERITY_CONFIG = {
    high: {
        label: "High Priority",
        dot: "bg-red-500",
        border: "border-l-red-500",
        badge: "bg-red-50 text-red-700 border-red-200",
        pill: "bg-red-500",
        glow: "shadow-red-100",
    },
    medium: {
        label: "Medium Priority",
        dot: "bg-amber-500",
        border: "border-l-amber-400",
        badge: "bg-amber-50 text-amber-700 border-amber-200",
        pill: "bg-amber-500",
        glow: "shadow-amber-100",
    },
    low: {
        label: "Standard",
        dot: "bg-indigo-500",
        border: "border-l-indigo-400",
        badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
        pill: "bg-indigo-500",
        glow: "shadow-indigo-100",
    },
};

function SkeletonCard() {
    return (
        <div className="bg-white rounded-xl border border-border border-l-4 border-l-slate-200 p-5 animate-pulse">
            <div className="flex items-start justify-between mb-3">
                <div className="h-4 bg-slate-100 rounded w-24" />
                <div className="h-6 bg-slate-100 rounded-full w-16" />
            </div>
            <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-slate-100 rounded w-1/2 mb-4" />
            <div className="border-t border-border pt-3 space-y-2">
                <div className="h-4 bg-slate-100 rounded w-full" />
                <div className="h-4 bg-slate-100 rounded w-5/6" />
            </div>
        </div>
    );
}

function RootCauseCard({ rc }: { rc: RootCauseResult }) {
    const severity = getSeverity(rc.count);
    const cfg = SEVERITY_CONFIG[severity];

    return (
        <div
            className={`bg-white rounded-xl border border-border border-l-4 ${cfg.border} p-5 shadow-sm ${cfg.glow} hover:shadow-md transition-shadow duration-200`}
        >
            {/* Header row */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                    <span className={`shrink-0 w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${cfg.badge}`}>
                        {cfg.label}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold text-white px-2.5 py-1 rounded-full ${cfg.pill}`}>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                        {rc.count} cases
                    </span>
                </div>
            </div>

            {/* Root cause headline */}
            <h3 className="text-base font-bold text-text-primary leading-snug mb-1">
                {rc.root_cause}
            </h3>

            {/* Department + Location */}
            <div className="flex items-center gap-2 mb-4">
                <span className="inline-block px-2 py-0.5 rounded-md bg-primary-50 text-primary-700 text-[10px] font-semibold border border-primary-100">
                    {rc.department}
                </span>
                <span className="text-xs text-text-muted">·</span>
                <span className="text-xs text-text-muted truncate">{rc.location_zone}</span>
            </div>

            {/* Fix + Impact */}
            <div className="border-t border-border pt-3 space-y-2.5">
                {/* Suggested fix */}
                <div className="flex gap-2.5">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                        <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.472-2.472a3.75 3.75 0 000-5.304L9.53 3.522a3.75 3.75 0 00-5.304 0l-.53.53a3.75 3.75 0 000 5.304l4.052 4.052M11.42 15.17L4.5 22.5" />
                        </svg>
                    </span>
                    <div>
                        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">Suggested Fix</p>
                        <p className="text-sm text-text-secondary">{rc.suggested_fix}</p>
                    </div>
                </div>

                {/* Estimated impact */}
                <div className="flex gap-2.5">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center mt-0.5">
                        <svg className="w-3 h-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                        </svg>
                    </span>
                    <div>
                        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">Est. Impact</p>
                        <p className="text-sm font-semibold text-text-primary">{rc.estimated_impact}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function RootCausePanel() {
    const [data, setData] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [cacheStatus, setCacheStatus] = useState<string | null>(null);
    const [expiresIn, setExpiresIn] = useState<number | null>(null);

    useEffect(() => {
        fetch("/api/root-cause")
            .then((res) => {
                setCacheStatus(res.headers.get("X-Cache"));
                const exp = res.headers.get("X-Cache-Expires-In");
                if (exp) setExpiresIn(Math.ceil(Number(exp) / 60));
                return res.json();
            })
            .then(setData)
            .catch(() => setData({ rootCauses: [], totalClustered: 0 }))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
            {/* Section header */}
            <div className="px-5 py-4 border-b border-border bg-surface-raised flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-text-primary">AI Root-Cause Analysis</h2>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-[10px] font-bold uppercase tracking-wider">
                        </span>
                    </div>
                    {!loading && data && data.rootCauses.length > 0 && (
                        <p className="text-xs text-text-muted mt-0.5">
                            {data.totalClustered} complaints traced to {data.rootCauses.length} root causes
                            {cacheStatus === "HIT" && expiresIn !== null && (
                                <span className="ml-2 text-emerald-600">· Cached · refreshes in ~{expiresIn}m</span>
                            )}
                        </p>
                    )}
                </div>
            </div>

            {/* Loading state */}
            {loading && (
                <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {[0, 1, 2].map((i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!loading && (!data || data.rootCauses.length === 0) && (
                <div className="p-10 flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21a48.25 48.25 0 01-8.135-.687c-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                        </svg>
                    </div>
                    <p className="text-sm font-semibold text-text-secondary">No significant clusters yet</p>
                    <p className="text-xs text-text-muted mt-1 max-w-xs">
                        Root-cause analysis activates when 3 or more complaints share the same category and geographic zone. Add more complaint data to see insights.
                    </p>
                </div>
            )}

            {/* Card grid */}
            {!loading && data && data.rootCauses.length > 0 && (
                <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {data.rootCauses.map((rc) => (
                        <RootCauseCard key={rc.cluster_index} rc={rc} />
                    ))}
                </div>
            )}
        </div>
    );
}