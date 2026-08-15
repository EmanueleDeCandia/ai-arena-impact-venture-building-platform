import { ensureSeeded, loadOpportunities, loadProjectList } from "@/lib/loaders";
import { AgentConsole } from "@/components/agent-console";

export const dynamic = "force-dynamic";

export default async function AiPage() {
  await ensureSeeded();
  const [projects, opportunities] = await Promise.all([loadProjectList(), loadOpportunities()]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-black text-slate-900">AI Console — Multi-Agent System</h2>
        <p className="text-sm text-slate-500">
          6 agenti con task distinti e Cited Reasoning: ogni step di ragionamento cita la fonte dati.
        </p>
      </div>
      <AgentConsole
        projects={projects.map((p) => ({ id: p.id, name: p.name, territory: p.territory }))}
        opportunities={opportunities.map((o) => ({ id: o.id, name: o.title, territory: o.territory }))}
      />
    </div>
  );
}
