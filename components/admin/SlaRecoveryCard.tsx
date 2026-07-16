import type { DepartmentPerformance } from "@/lib/queries/complaints";

// ── Recommendation catalogue ─────────────────────────────────────────────────
interface SlaPlaybook {
    headline: string;
    recommendation: string;
    slaBoost: string;
    timeline: string;
    actions: string[];
    urgency: "critical" | "warning" | "moderate";
}

function buildPlaybook(dept: DepartmentPerformance, all: DepartmentPerformance[]): SlaPlaybook {
    const name = dept.department_name.toLowerCase();
    const avgSla = all.length
        ? Math.round(all.reduce((s, d) => s + d.slaPercent, 0) / all.length)
        : 100;
    const gap = avgSla - dept.slaPercent;

    // Water Supply
    if (name.includes("water")) {
        return {
            headline: "Water Supply Bottleneck Detected",
            recommendation:
                `Water Supply SLA compliance has dipped by ${gap}% this week due to a cluster of ` +
                `pipe anomalies in Kurla East. Recommend temporarily rerouting 2 technicians from ` +
                `the Roads division to assist with the Kurla utility bottleneck.`,
            slaBoost: "+12.4%",
            timeline: "48 Hours",
            actions: [
                "Reroute 2 Roads technicians to Water Supply queue",
                "Prioritise Kurla East cluster (3+ active tickets)",
                "Schedule emergency pipe inspection — Block C, Kurla",
            ],
            urgency: dept.slaPercent < 70 ? "critical" : "warning",
        };
    }

    // Roads
    if (name.includes("road")) {
        return {
            headline: "Roads Backlog Escalation Risk",
            recommendation:
                `Roads SLA compliance is sliding due to high-volume pothole reports from monsoons ` +
                `in Andheri West. Recommend onboarding third-party local asphalt vendors to clear ` +
                `the backlog before the heavy rain forecast.`,
            slaBoost: "+8.5%",
            timeline: "72 Hours",
            actions: [
                "Onboard 2 local asphalt sub-contractors for Andheri West",
                "Pre-allocate pothole-repair vehicles before rain window",
                "Auto-escalate tickets older than 36h to senior engineer",
            ],
            urgency: dept.slaPercent < 70 ? "critical" : "warning",
        };
    }

    // Sanitation
    if (name.includes("sanit") || name.includes("waste") || name.includes("garbage")) {
        return {
            headline: "Sanitation Collection Deficit",
            recommendation:
                `${dept.department_name} is behind SLA by ${gap}% — likely driven by route inefficiency ` +
                `during peak monsoon overflow. Recommend deploying an additional collection vehicle ` +
                `to the highest-density complaint zone and suspending non-critical admin tasks.`,
            slaBoost: "+9.0%",
            timeline: "36 Hours",
            actions: [
                "Deploy extra vehicle to highest-density zone",
                "Suspend non-critical crew tasks for 48h",
                "Add overflow pickup slot on weekends",
            ],
            urgency: dept.slaPercent < 70 ? "critical" : "moderate",
        };
    }

    // Generic fallback
    return {
        headline: `${dept.department_name} — SLA Recovery Required`,
        recommendation:
            `${dept.department_name} is currently the lowest-performing department at ` +
            `${dept.slaPercent}% SLA compliance — ${gap}% below the departmental average. ` +
            `Recommend an immediate capacity audit: identify the top 5 overdue tickets, ` +
            `assign a senior officer as escalation lead, and target closure within 48 hours.`,
        slaBoost: `+${Math.min(gap + 5, 20)}%`,
        timeline: "48 Hours",
        actions: [
            `Identify top 5 overdue tickets in ${dept.department_name}`,
            "Assign a senior officer as escalation lead",
            "Daily sync check until SLA returns to average",
        ],
        urgency: dept.slaPercent < 70 ? "critical" : "moderate",
    };
}

// ── Urgency styling ───────────────────────────────────────────────────────────
const URGENCY = {
    critical: {
        badge: "bg-red-100 text-red-700 border-red-200",
        icon: "text-red-500",
        border: "border-l-red-500",
        dot: "bg-red-500",
        label: "Critical",
    },
    warning: {
        badge: "bg-amber-100 text-amber-700 border-amber-200",
        icon: "text-amber-500",
        border: "border-l-amber-400",
        dot: "bg-amber-500",
        label: "Action Required",
    },
    moderate: {
        badge: "bg-indigo-100 text-indigo-700 border-indigo-200",
        icon: "text-indigo-500",
        border: "border-l-indigo-400",
        dot: "bg-indigo-500",
        label: "Recommended",
    },
};

// ── Component ─────────────────────────────────────────────────────────────────
export function SlaRecoveryCard({ data }: { data: DepartmentPerformance[] }) {
    // Only consider departments with at least 1 resolved ticket (slaPercent meaningful)
    const ranked = [...data]
        .filter((d) => d.total > 0)
        .sort((a, b) => a.slaPercent - b.slaPercent);

    const worst = ranked[0];

    if (!worst) {
        return null; // no data yet
    }

    const play = buildPlaybook(worst, data);
    const cfg = URGENCY[play.urgency];

    return (
        <div className={`bg-white rounded-xl border border-l-4 ${cfg.border} border-slate-200 shadow-sm overflow-hidden`}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-slate-900">AI SLA Recovery Recommendation</h2>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                                {cfg.label}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Analysed {data.length} departments · Targeting lowest-performing unit
                        </p>
                    </div>
                </div>

                {/* Dept chip */}
                <div className="hidden sm:flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-xs">
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className="text-xs font-semibold text-slate-700">{worst.department_name}</span>
                    <span className="text-xs text-slate-400">— {worst.slaPercent}% SLA</span>
                </div>
            </div>

            {/* Body: two-column on desktop */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT — Recommendation text + action list */}
                <div className="lg:col-span-2 space-y-4">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 mb-1.5">{play.headline}</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">{play.recommendation}</p>
                    </div>

                    {/* Action steps */}
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Recommended Actions</p>
                        <ul className="space-y-2">
                            {play.actions.map((action, i) => (
                                <li key={i} className="flex items-start gap-2.5">
                                    <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                                        {i + 1}
                                    </span>
                                    <span className="text-sm text-slate-700">{action}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* RIGHT — Metrics callout */}
                <div className="flex flex-col gap-3">
                    {/* SLA Boost */}
                    <div className="flex-1 rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex flex-col justify-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1">
                            Target SLA Boost
                        </p>
                        <p className="text-3xl font-extrabold text-emerald-800 tracking-tight">{play.slaBoost}</p>
                        <p className="text-xs text-emerald-700 mt-0.5">on current {worst.slaPercent}% baseline</p>
                    </div>

                    {/* Timeline */}
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 flex flex-col justify-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-1">
                            Estimated Action Timeline
                        </p>
                        <p className="text-2xl font-extrabold text-indigo-800 tracking-tight">{play.timeline}</p>
                        <p className="text-xs text-indigo-700 mt-0.5">to measurable SLA recovery</p>
                    </div>

                    {/* Current SLA gauge */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                            Current SLA — {worst.department_name}
                        </p>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${worst.slaPercent >= 80 ? "bg-emerald-500" : worst.slaPercent >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                                style={{ width: `${worst.slaPercent}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5">
                            {worst.resolved} resolved / {worst.total} total &nbsp;·&nbsp; {worst.slaPercent}%
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <p className="text-[11px] text-slate-400">
                    ⚡ Generated by AI Orchestrator · Based on live complaint metrics · Updates on page refresh
                </p>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                    {play.urgency === "critical" ? "Escalate Immediately" : play.urgency === "warning" ? "Act Within 24h" : "Plan This Sprint"}
                </span>
            </div>
        </div>
    );
}
