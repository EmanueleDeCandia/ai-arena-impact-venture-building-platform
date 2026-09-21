"use client";

import { useState } from "react";
import { FileSignature, FileText, Plus, ShieldCheck, Trash2 } from "lucide-react";
import type { ProjectDTO } from "@/lib/types";
import { addDocument, removeDocument, signDocument } from "@/actions";
import { useRole } from "@/components/role-provider";
import { hasPerm } from "@/lib/permissions";
import { cn, formatDate } from "@/lib/format";
import { Badge, btnPrimary, btnSecondary, Card, Field, inputCls, SectionTitle } from "@/components/ui";

const CATEGORIES = [
  { key: "TERM_SHEET", label: "Term Sheet" },
  { key: "CONTRACT", label: "Contratto" },
  { key: "FINANCIAL", label: "Finanziario" },
  { key: "LEGAL", label: "Legale / Compliance" },
  { key: "EVIDENCE", label: "Evidenza" },
];

export function DealRoom({ project }: { project: ProjectDTO }) {
  const { user } = useRole();
  const canEdit = hasPerm(user.role, "finance.edit") || hasPerm(user.role, "project.edit");
  const [form, setForm] = useState({ title: "", category: "CONTRACT" });

  const termSheetSigned = project.documents.some((d) => d.category === "TERM_SHEET" && d.status === "SIGNED");

  return (
    <div className="space-y-5">
      <Card className={cn("p-4", termSheetSigned ? "border-emerald-200 bg-emerald-50/40" : "border-amber-200 bg-amber-50/40")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-slate-800">
              {termSheetSigned ? "✓ Term Sheet firmato da tutti gli stakeholder" : "⏳ Term Sheet non ancora firmato"}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              La firma del Term Sheet è vincolante per la transizione Underwriting → Funding (RF-05 · criteri di accettazione).
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!termSheetSigned && canEdit && (
              <button
                type="button"
                className={btnPrimary}
                onClick={async () => {
                  const existingTs = project.documents.find((d) => d.category === "TERM_SHEET");
                  if (existingTs) {
                    await signDocument(existingTs.id, user.id);
                  } else {
                    await addDocument(
                      project.id,
                      { title: `Term Sheet Blended Finance — ${project.name}`, category: "TERM_SHEET", sizeKb: 240 },
                      user.id
                    );
                  }
                }}
              >
                <FileSignature className="h-4 w-4" />
                {project.documents.some((d) => d.category === "TERM_SHEET")
                  ? "Firma Term Sheet Ora"
                  : "Genera Term Sheet Predefinito"}
              </button>
            )}
            <ShieldCheck className={cn("h-6 w-6", termSheetSigned ? "text-emerald-500" : "text-amber-400")} />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <SectionTitle
          title="Data Room — documenti con permessi granulari"
          subtitle="RF-06.1 · firma elettronica DocuSign/Adobe Sign (mock)"
          right={
            canEdit && (
              <button className={btnSecondary} onClick={() => setForm({ ...form, title: form.title || "" })}>
                <Plus className="h-4 w-4" /> Carica documento
              </button>
            )
          }
        />

        {canEdit && (
          <div className="mb-4 flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-slate-300 p-3">
            <div className="min-w-52 flex-1">
              <Field label="Titolo documento">
                <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="es. Term Sheet strutturato" />
              </Field>
            </div>
            <div className="w-44">
              <Field label="Categoria">
                <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <button
              className={btnPrimary}
              onClick={async () => {
                if (!form.title.trim()) return;
                await addDocument(project.id, { title: form.title, category: form.category }, user.id);
                setForm({ title: "", category: "CONTRACT" });
              }}
            >
              <Plus className="h-4 w-4" /> Carica
            </button>
          </div>
        )}

        <div className="space-y-2">
          {project.documents.map((d) => (
            <div key={d.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
              <FileText className="h-4 w-4 shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-slate-800">{d.title}</div>
                <div className="text-[10px] text-slate-400">
                  {CATEGORIES.find((c) => c.key === d.category)?.label ?? d.category} · {d.sizeKb > 0 ? `${d.sizeKb} KB` : "n/d"} · di {d.uploadedByName ?? "—"} · {formatDate(d.uploadedAt)}
                </div>
              </div>
              <Badge
                className={
                  d.status === "SIGNED"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }
              >
                {d.status === "SIGNED" ? "✓ Firmato" : "Bozza"}
              </Badge>
              {canEdit && d.status !== "SIGNED" && (
                <button
                  className={btnSecondary}
                  onClick={() => signDocument(d.id, user.id)}
                  title="Firma elettronica (mock DocuSign)"
                >
                  <FileSignature className="h-4 w-4" /> Firma
                </button>
              )}
              {canEdit && (
                <button
                  type="button"
                  className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                  onClick={() => removeDocument(d.id, user.id)}
                  title="Elimina documento"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {project.documents.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-400">Nessun documento nella data room</p>
          )}
        </div>
      </Card>
    </div>
  );
}
