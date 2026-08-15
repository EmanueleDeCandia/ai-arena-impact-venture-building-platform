import { desc } from "drizzle-orm";
import { db } from "@/db";
import { auditLog } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(auditLog).orderBy(desc(auditLog.timestamp)).limit(5000);

  const esc = (v: string | number | null | undefined) =>
    `"${String(v ?? "").replace(/"/g, '""')}"`;

  const header = ["timestamp", "user", "action", "entity_type", "entity_id", "details"].join(",");
  const lines = rows.map((r) =>
    [r.timestamp.toISOString(), r.userName, r.action, r.entityType, r.entityId ?? "", r.details ?? ""]
      .map(esc)
      .join(",")
  );

  const csv = `\uFEFF${[header, ...lines].join("\n")}`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="impact-forge-audit-log.csv"',
    },
  });
}
