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
        <h1 className="text-2xl font-bold text-text-primary">AI Insights</h1>
        <p className="text-sm text-text-secondary mt-1">
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
