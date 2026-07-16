import { createClient } from "@/lib/supabase/server";
import { getDepartmentPerformance } from "@/lib/queries/complaints";
import { RootCausePanel } from "@/components/admin/RootCausePanel";
import { SlaRecoveryCard } from "@/components/admin/SlaRecoveryCard";

export default async function AiInsightsPage() {
  const supabase = await createClient();
  const deptPerformance = await getDepartmentPerformance(supabase);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#1c1917]">AI Insights</h1>
        <p className="text-base text-[#4a423a] mt-1.5">
          AI-generated root cause analysis and recovery recommendations
        </p>
      </div>

      <div className="mb-8">
        <RootCausePanel />
      </div>

      <div className="mb-8">
        <SlaRecoveryCard data={deptPerformance} />
      </div>
    </>
  );
}
