"use client";

import { useState } from "react";
import { Bot, Play } from "lucide-react";
import type { AgentName, AgentResult } from "@/lib/agents";
import { AGENTS } from "@/lib/agents";
import { runAgent } from "@/actions";
import { useRole } from "@/components/role-provider";
import { cn } from "@/lib/format";
import { Badge, btnPrimary, Card, inputCls } from "@/components/ui";
import { INSTRUMENT_META } from "@/lib/finance";
import { fmtEURCompact } from "@/lib/format";

type ListItem = { id: number; name: string; territory: string };

const AGENT_COLOR: Record<AgentName, string> = {
  scout: "text-cyan-600 bg-cyan-50",
  architect: "text-sky-600 bg-sky-50",
  structurer: "text-violet-600 bg-violet-50",
  underwriter: "text-blue-600 bg-blue-50",
  mrv: "text-amber-600 bg-amber-50",
  storyteller: "text-rose-600 bg-rose-50",
};

export function AgentConsole({
  projects,
  opportunities,
}: {
  projects: ListItem[];
  opportunities: ListItem[];
}) {
  const { user } = useRole();
  const [projectId, setProjectId] = useState<number>(projects[0]?.id ?? 0);
  const [opportunityId, setOpportunityId] = useState<number>(opportunities[0]?.id ?? 0);
  const [audience, setAudience] = useState("bank");
  const [results, setResults] = useState<Partial<Record<AgentName, AgentResult>>>({});
  const [busy, setBusy] = useState<AgentName | null>(null);

  const run = async (agent: AgentName) => {
    setBusy(agent);
    const ctx =
      agent === "scout"
        ? { opportunityId }
        : { projectId, audience };
    const res = await runAgent(agent, ctx, user.id);
    setResults((r) => ({ ...r, [agent]: res }));
    setBusy(null);
  };

  const structurerPayload = results.structurer?.payload.proposedTranches as
    | Array<{ instrument: keyof typeof INSTRUMENT_META; label: string; provider: string; amount: number; ratePct: number; maturityMonths: number }>
    | undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Contesto progetto</div>
          <select className={inputCls} value={projectId} onChange={(e) => setProjectId(Number(e.target.value))}>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.id} · {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Opportunità (Scout)</div>
          <select className={inputCls} value={opportunityId} onChange={(e) => setOpportunityId(Number(e.target.value))}>
            {opportunities.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Pubblico (Storyteller)</div>
          <select className={inputCls} value={audience} onChange={(e) => setAudience(e.target.value)}>
            <option value="bank">Banca</option>
            <option value="pa">Pubblica Amministrazione</option>
            <option value="citizen">Cittadino</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {AGENTS.map((a) => {
          const res = results[a.key];
          return (
            <Card key={a.key} className="flex flex-col p-4">
              <div className="flex items-center gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", AGENT_COLOR[a.key])}>
                  <Bot className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900">{a.name}</div>
                  <div className="text-[11px] text-slate-400">{a.role}</div>
                </div>
              </div>
              <p className="mt-2 flex-1 text-xs text-slate-500">{a.desc}</p>
              <button className={cn(btnPrimary, "mt-3 w-full")} onClick={() => run(a.key)} disabled={busy !== null}>
                <Play className="h-4 w-4" />
                {busy === a.key ? "Elaborazione…" : "Esegui agente"}
              </button>

              {res && (
                <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                  <div className="text-xs font-bold text-slate-700">{res.title}</div>
                  <p className="text-xs text-slate-600">{res.summary}</p>
                  <div className="max-h-52 space-y-1.5 overflow-y-auto">
                    {res.steps.map((st, i) => (
                      <div key={i} className="rounded-md bg-slate-50 px-2.5 py-1.5">
                        <div className="text-[11px] leading-relaxed text-slate-600">{st.text}</div>
                        <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-violet-500">📚 {st.source}</div>
                      </div>
                    ))}
                  </div>
                  {a.key === "structurer" && structurerPayload && (
                    <div className="space-y-1">
                      {structurerPayload.map((t, i) => (
                        <div key={i} className="flex items-center justify-between rounded-md border border-slate-100 px-2 py-1">
                          <div className="flex items-center gap-1.5">
                            <span className={cn("h-2 w-2 rounded-full", INSTRUMENT_META[t.instrument]?.bar ?? "bg-slate-300")} />
                            <span className="text-[11px] font-semibold text-slate-700">{t.label}</span>
                          </div>
                          <Badge className="border-slate-200 bg-white text-slate-500">{fmtEURCompact(t.amount)}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
