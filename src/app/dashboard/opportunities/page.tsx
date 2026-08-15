import { ensureSeeded, loadOpportunities } from "@/lib/loaders";
import { OpportunityRadar } from "@/components/opportunity-radar";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  await ensureSeeded();
  const opportunities = await loadOpportunities();

  return <OpportunityRadar opportunities={opportunities} />;
}
