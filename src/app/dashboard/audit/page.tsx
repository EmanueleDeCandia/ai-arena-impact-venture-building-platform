import { Download, ShieldCheck } from "lucide-react";
import { ensureSeeded, loadAudit } from "@/lib/loaders";
import { formatDate, timeAgo } from "@/lib/format";
import { Badge, Card, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

const ACTION_COLOR: Record<string, string> = {
  CREA_FOUNDRY: "border-emerald-200 bg-emerald-50 text-emerald-700",
  AVANZA_STATO: "border-sky-200 bg-sky-50 text-sky-700",
  VALIDA_EVIDENZA: "border-emerald-200 bg-emerald-50 text-emerald-700",
  RESPINGE_EVIDENZA: "border-rose-200 bg-rose-50 text-rose-600",
  INVIO_EVIDENZA: "border-amber-200 bg-amber-50 text-amber-700",
  ESEGUE_AGENTE: "border-violet-200 bg-violet-50 text-violet-700",
};

export default async function AuditPage() {
  await ensureSeeded();
  const audit = await loadAudit(200);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900">Audit Log immutabile</h2>
          <p className="text-sm text-slate-500">
            RF-12.3 — chi ha fatto cosa, quando, su quale dato. Export per revisore e regolatore.
          </p>
        </div>
        <a
          href="/api/audit/export"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <Download className="h-4 w-4" /> Export CSV
        </a>
      </div>

      <Card className="p-4">
        <SectionTitle
          title={`${audit.length} eventi registrati`}
          subtitle="Ogni entità della piattaforma ha created_by, updated_by, validato"
          right={<Badge className="border-emerald-200 bg-emerald-50 text-emerald-700"><ShieldCheck className="h-3 w-3" /> append-only</Badge>}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[10px] uppercase tracking-wider text-slate-400">
                <th className="px-3 py-2">Data</th>
                <th className="px-3 py-2">Utente</th>
                <th className="px-3 py-2">Azione</th>
                <th className="px-3 py-2">Entità</th>
                <th className="px-3 py-2">Dettaglio</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 align-top">
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-slate-400">
                    {formatDate(a.timestamp)} · {timeAgo(a.timestamp)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs font-bold text-slate-800">{a.userName}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <Badge className={ACTION_COLOR[a.action] ?? "border-slate-200 bg-slate-50 text-slate-600"}>{a.action}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-slate-500">
                    {a.entityType}
                    {a.entityId ? ` #${a.entityId}` : ""}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-600">{a.details ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
