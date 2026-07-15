"use client";

import dynamic from "next/dynamic";
import type { ComplaintMapPoint } from "@/lib/queries/complaints";

const ComplaintsMap = dynamic(() => import("@/components/admin/ComplaintsMap"), {
    ssr: false,
    loading: () => (
        <div className="h-[400px] flex items-center justify-center text-sm text-text-muted">
            Loading map...
        </div>
    ),
});

export default function ComplaintsMapLoader({ points }: { points: ComplaintMapPoint[] }) {
    return <ComplaintsMap points={points} />;
}