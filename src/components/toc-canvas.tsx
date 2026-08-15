"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Plus,
  Save,
  Send,
  Trash2,
  UserCheck,
} from "lucide-react";
import type { ImpactCanvas, RaciItem, ToC } from "@/db/schema";
import type { CommentDTO, ProjectDTO } from "@/lib/types";
import { addComment, saveImpactCanvas, saveRaci, saveToc, validateToc } from "@/actions";
import { useRole } from "@/components/role-provider";
import { hasPerm } from "@/lib/permissions";
import { cn, fmtNum, timeAgo } from "@/lib/format";
import { Badge, btnPrimary, btnSecondary, Card, EmptyState, inputCls } from "@/components/ui";

const COLS: { key: keyof Omit<ToC, "validated">; label: string; color: string; hint: string }[] = [
  { key: "inputs", label: "Input", color: "border-slate-300", hint: "Risorse immesse" },
  { key: "activities", label: "Attività", color: "border-sky-300", hint: "Cosa viene fatto" },
  { key: "outputs", label: "Output", color: "border-teal-300", hint: "Prodotti diretti" },
  { key: "outcomes", label: "Outcome", color: "border-amber-300", hint: "Cambiamenti nei beneficiari" },
  { key: "impacts", label: "Impatto", color: "border-emerald-400", hint: "Effetti sistemici" },
];

function ReadOnlyRoleNotice() {
  const { user, users, setUserId } = useRole();
  const editable = hasPerm(user.role, "project.edit");
  if (editable) return null;

  const originatorUser = users.find((u) => u.role === "ORIGINATOR");
  const adminUser = users.find((u) => u.role === "SUPER_ADMIN");

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-900">
      <div className="flex items-center gap-1.5 font-medium">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
        <span>
          Modalità Sola Lettura come <b>{user.name} ({user.role})</b>. Per aggiungere, modificare o eliminare voci passa a:
        </span>
      </div>
      <div className="flex items-center gap-2">
        {originatorUser && (
          <button
            type="button"
            onClick={() => setUserId(originatorUser.id)}
            className="rounded bg-white px-2 py-1 text-[11px] font-bold text-amber-900 border border-amber-300 shadow-sm hover:bg-amber-100"
          >
            Passa a Giulia Moretti (Originator)
          </button>
        )}
        {adminUser && (
          <button
            type="button"
            onClick={() => setUserId(adminUser.id)}
            className="rounded bg-white px-2 py-1 text-[11px] font-bold text-amber-900 border border-amber-300 shadow-sm hover:bg-amber-100"
          >
            Passa a Super Admin
          </button>
        )}
      </div>
    </div>
  );
}

function ListColumn({
  label,
  color,
  hint,
  items,
  editable,
  onAdd,
  onRemove,
}: {
  label: string;
  color: string;
  hint: string;
  items: string[];
  editable: boolean;
  onAdd: (v: string) => void;
  onRemove: (i: number) => void;
}) {
  const [draft, setDraft] = useState("");
  return (
    <div className={cn("flex flex-col rounded-xl border-2 bg-white p-3", color)}>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-slate-700">{label}</span>
        <span className="text-[10px] text-slate-400">{hint}</span>
      </div>
      <div className="flex-1 space-y-2">
        {items.map((item, i) => (
          <div
            key={`${label}-${i}`}
            className="group relative rounded-lg bg-slate-50 px-2.5 py-2 text-xs leading-relaxed text-slate-700 hover:bg-slate-100/80 transition-colors"
          >
            {item}
            {editable && (
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white shadow opacity-0 group-hover:opacity-100 transition-opacity"
                title="Elimina voce"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-200 py-3 text-center text-[11px] text-slate-400">
            vuoto
          </div>
        )}
      </div>
      {editable && (
        <div className="mt-2 flex gap-1.5">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && draft.trim()) {
                onAdd(draft.trim());
                setDraft("");
              }
            }}
            placeholder="+ aggiungi voce"
            className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-emerald-400 shadow-sm"
          />
          {draft.trim() && (
            <button
              type="button"
              onClick={() => {
                onAdd(draft.trim());
                setDraft("");
              }}
              className="rounded-md bg-emerald-600 px-2 text-white text-xs font-bold hover:bg-emerald-700"
            >
              +
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function RaciEditor({ project }: { project: ProjectDTO }) {
  const { user } = useRole();
  const editable = hasPerm(user.role, "project.edit");
  const [rows, setRows] = useState<RaciItem[]>(project.raci);
  const [saved, setSaved] = useState(false);

  const update = (i: number, field: keyof RaciItem, value: string) => {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-700">RACI — Matrice di Responsabilità</h4>
          <p className="text-xs text-slate-400">Assegna ruoli R/A/C/I per ciascun work package del progetto</p>
        </div>
        <div className="flex gap-2">
          {editable && (
            <button
              className={btnSecondary}
              onClick={() => setRows((r) => [...r, { wp: "Nuovo WP", r: "", a: "", c: "", i: "" }])}
            >
              <Plus className="h-4 w-4" /> Aggiungi WP
            </button>
          )}
          {editable && (
            <button
              className={btnPrimary}
              onClick={async () => {
                await saveRaci(project.id, rows, user.id);
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
              }}
            >
              <Save className="h-4 w-4" /> Salva RACI
            </button>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState text="Nessun work package RACI definito. Clicca '+ Aggiungi WP' per iniziare." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-3 py-2">Work Package</th>
                <th className="px-3 py-2">R — Responsible</th>
                <th className="px-3 py-2">A — Accountable</th>
                <th className="px-3 py-2">C — Consulted</th>
                <th className="px-3 py-2">I — Informed</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t border-slate-100 hover:bg-slate-50/50">
                  {(["wp", "r", "a", "c", "i"] as const).map((f) => (
                    <td key={f} className="px-2 py-1.5">
                      <input
                        value={row[f]}
                        disabled={!editable}
                        onChange={(e) => update(i, f, e.target.value)}
                        className="w-full rounded-md border border-transparent bg-white px-2 py-1 outline-none focus:border-emerald-300 disabled:bg-transparent text-slate-800"
                        placeholder={f === "wp" ? "Nome WP…" : "Stakeholder…"}
                      />
                    </td>
                  ))}
                  <td className="px-2 py-1.5 text-center">
                    {editable && (
                      <button
                        type="button"
                        onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))}
                        className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                        title="Elimina riga RACI"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {saved && <p className="mt-2 text-xs font-semibold text-emerald-600">✓ Matrice RACI salvata con successo</p>}
    </div>
  );
}

function BmcEditor({ project }: { project: ProjectDTO }) {
  const { user } = useRole();
  const editable = hasPerm(user.role, "project.edit");
  const [canvas, setCanvas] = useState<ImpactCanvas>(project.impactCanvas);
  const [saved, setSaved] = useState(false);
  const lists: { key: "costStructure" | "revenueStreams" | "keyPartners" | "keyResources"; label: string }[] = [
    { key: "costStructure", label: "Cost Structure (Costi Chiave)" },
    { key: "revenueStreams", label: "Revenue Streams (Ricavi & Fonti di Entrata)" },
    { key: "keyPartners", label: "Key Partners (Alleati Chiave)" },
    { key: "keyResources", label: "Key Resources (Asset e Risorse)" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-700">Business Model Canvas ad Impatto</h4>
          <p className="text-xs text-slate-400">Modello di sostenibilità economica e sociale</p>
        </div>
        {editable && (
          <button
            className={btnPrimary}
            onClick={async () => {
              await saveImpactCanvas(project.id, canvas, user.id);
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }}
          >
            <Save className="h-4 w-4" /> Salva BMC a Impatto
          </button>
        )}
      </div>

      {saved && <p className="-mt-2 text-xs font-semibold text-emerald-600">✓ Canvas BMC salvato con successo</p>}

      <div className="grid gap-3 md:grid-cols-2">
        {lists.map((l) => (
          <div key={l.key} className="rounded-lg border border-slate-200 p-3 bg-white">
            <div className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-500">{l.label}</div>
            <div className="space-y-1.5">
              {canvas[l.key].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={item}
                    disabled={!editable}
                    onChange={(e) =>
                      setCanvas((c) => ({
                        ...c,
                        [l.key]: c[l.key].map((x, idx) => (idx === i ? e.target.value : x)),
                      }))
                    }
                    className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-emerald-400 disabled:bg-slate-50"
                  />
                  {editable && (
                    <button
                      type="button"
                      onClick={() => setCanvas((c) => ({ ...c, [l.key]: c[l.key].filter((_, idx) => idx !== i) }))}
                      className="text-slate-300 hover:text-rose-500 p-1"
                      title="Elimina voce"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {editable && (
              <button
                type="button"
                className="mt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                onClick={() => setCanvas((c) => ({ ...c, [l.key]: [...c[l.key], ""] }))}
              >
                + aggiungi voce
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <div className="mb-1 text-[11px] font-black uppercase tracking-wider text-slate-500">Beneficiari paganti (Clienti / Payer)</div>
          <textarea
            value={canvas.payingBeneficiaries}
            disabled={!editable}
            onChange={(e) => setCanvas((c) => ({ ...c, payingBeneficiaries: e.target.value }))}
            className={cn(inputCls, "h-16 disabled:bg-slate-50")}
            placeholder="Chi sostiene economicamente il servizio…"
          />
        </div>
        <div>
          <div className="mb-1 text-[11px] font-black uppercase tracking-wider text-slate-500">Beneficiari non paganti (Comunità / Utenti fragili)</div>
          <textarea
            value={canvas.nonPayingBeneficiaries}
            disabled={!editable}
            onChange={(e) => setCanvas((c) => ({ ...c, nonPayingBeneficiaries: e.target.value }))}
            className={cn(inputCls, "h-16 disabled:bg-slate-50")}
            placeholder="Chi riceve il beneficio sociale o territoriale…"
          />
        </div>
      </div>
    </div>
  );
}

function Comments({ project }: { project: ProjectDTO }) {
  const { user } = useRole();
  const [text, setText] = useState("");
  const [comments, setComments] = useState<CommentDTO[]>(project.comments);
  const [busy, setBusy] = useState(false);

  const handleSend = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    const res = await addComment(project.id, "TOC", text.trim(), user.id);
    if (res.ok) {
      setComments([
        ...comments,
        {
          id: Date.now(),
          userName: user.name,
          section: "TOC",
          text: text.trim(),
          createdAt: new Date().toISOString(),
        },
      ]);
      setText("");
    }
    setBusy(false);
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-slate-400" />
        <h4 className="text-sm font-bold text-slate-700">Commenti & Thread Collaborativo</h4>
      </div>

      <div className="space-y-2">
        {comments.map((c) => (
          <div key={c.id} className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 text-xs">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="font-bold text-slate-700">{c.userName}</span>
              <span>{timeAgo(c.createdAt)}</span>
            </div>
            <div className="mt-1 text-slate-600">{c.text}</div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-xs text-slate-400">Nessun commento presente nel progetto.</p>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Aggiungi una nota o richiesta per il team…"
          className={cn(inputCls, "flex-1")}
          onKeyDown={async (e) => {
            if (e.key === "Enter") {
              await handleSend();
            }
          }}
        />
        <button
          type="button"
          className={btnPrimary}
          disabled={busy || !text.trim()}
          onClick={handleSend}
        >
          <Send className="h-4 w-4" /> Invia
        </button>
      </div>
    </div>
  );
}

export function TocCanvas({ project }: { project: ProjectDTO }) {
  const { user } = useRole();
  const editable = hasPerm(user.role, "project.edit");
  const [toc, setToc] = useState<ToC>(project.toc);
  const [saved, setSaved] = useState(false);

  const setField = (key: keyof Omit<ToC, "validated">, items: string[]) =>
    setToc((t) => ({ ...t, [key]: items }));

  return (
    <div className="space-y-6">
      <ReadOnlyRoleNotice />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Teoria del Cambiamento</h3>
          <p className="text-xs text-slate-400">Input → Attività → Output → Outcome → Impatto · edit collaborativo con eliminazione e aggiunta</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className={toc.validated ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}
          >
            {toc.validated ? "✓ ToC validata (multi-firma)" : "ToC non validata"}
          </Badge>
          {editable && (
            <button
              type="button"
              className={btnSecondary}
              onClick={async () => {
                const res = await validateToc(project.id, !toc.validated, user.id);
                if (res.ok) setToc(res.toc);
              }}
            >
              <CheckCircle2 className="h-4 w-4" />
              {toc.validated ? "Ritira validazione" : "Valida ToC"}
            </button>
          )}
          {editable && (
            <button
              type="button"
              className={btnPrimary}
              onClick={async () => {
                await saveToc(project.id, toc, user.id);
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
              }}
            >
              <Save className="h-4 w-4" /> Salva Canvas ToC
            </button>
          )}
        </div>
      </div>
      {saved && <p className="-mt-3 text-xs font-semibold text-emerald-600">✓ Canvas ToC salvato con successo</p>}

      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {COLS.map((col) => (
          <ListColumn
            key={col.key}
            label={col.label}
            color={col.color}
            hint={col.hint}
            items={toc[col.key]}
            editable={editable}
            onAdd={(v) => setField(col.key, [...toc[col.key], v])}
            onRemove={(i) => setField(col.key, toc[col.key].filter((_, idx) => idx !== i))}
          />
        ))}
      </div>

      <Card className="p-4">
        <RaciEditor project={project} />
      </Card>

      <Card className="p-4">
        <BmcEditor project={project} />
      </Card>

      <Card className="p-4">
        <Comments project={project} />
      </Card>
    </div>
  );
}
