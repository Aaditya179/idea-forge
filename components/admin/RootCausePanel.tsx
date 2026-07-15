"use client";

import { useEffect, useState } from "react";

interface RootCause {
    cluster_index: number;
    root_cause: string;
    suggested_fix: string;
    department: string;
    count: number;
}

export function RootCausePanel() {
    const [data, setData] = useState<{ rootCauses: RootCause[]; totalClustered: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/root-cause")
            .then((res) => res.json())
            .then(setData)
            .catch(() => setData({ rootCauses: [], totalClustered: 0 }))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-border p-6 text-sm text-text-muted">
                Analyzing complaint clusters for root causes...
            </div>
        );
    }

    if (!data || data.rootCauses.length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-surface-raised">
                <h2 className="text-base font-bold text-text-primary">AI Root-Cause Analysis</h2>
                <p className="text-xs text-text-muted mt-0.5">
                    {data.totalClustered} complaints traced to {data.rootCauses.length} root causes
                </p>
            </div>
            <div className="divide-y divide-border">
                {data.rootCauses.map((rc) => (
                    <div key={rc.cluster_index} className="px-5 py-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold text-text-primary">{rc.root_cause}</p>
                                <p className="text-xs text-text-secondary mt-1">{rc.suggested_fix}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <span className="inline-block px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
                                    {rc.department}
                                </span>
                                <p className="text-xs text-text-muted mt-1">{rc.count} cases</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}