import { db, ensureDbReady, isPglite } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDbReady();
    await db.execute(sql`select 1 as ping`);
    return Response.json({
      ok: true,
      mode: isPglite ? "embedded-pglite" : "remote-postgresql",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return Response.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}
