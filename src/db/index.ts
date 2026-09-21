import path from "path";
import fs from "fs";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";
import * as schema from "./schema";
import { SCHEMA_DDL } from "./schema-ddl";

const databaseUrl = process.env.DATABASE_URL || "";
const usePgliteExplicit = process.env.DATABASE_DRIVER === "pglite" || databaseUrl.startsWith("pglite:");
const isLocalDefaultPg = databaseUrl.includes("127.0.0.1:5432") || databaseUrl.includes("localhost:5432");

interface DbContainer {
  db: ReturnType<typeof drizzlePg> | ReturnType<typeof drizzlePglite>;
  pool?: Pool;
  pglite?: PGlite;
  isPglite: boolean;
  initPromise?: Promise<void>;
  ready?: boolean;
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaDbContainer?: DbContainer;
};

function cleanStalePid(dataDir: string) {
  try {
    const pidFile = path.join(dataDir, "postmaster.pid");
    if (fs.existsSync(pidFile)) {
      fs.unlinkSync(pidFile);
    }
  } catch (e) {
    console.warn("Impossibile rimuovere postmaster.pid:", e);
  }
}

function createPgliteContainer(): { db: ReturnType<typeof drizzlePglite>; pglite: PGlite; isPglite: true } {
  const dataDir = path.resolve(process.cwd(), ".data", "pglite-db");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  } else {
    cleanStalePid(dataDir);
  }

  const pglite = new PGlite(dataDir);
  const db = drizzlePglite(pglite, { schema });
  return { db, pglite, isPglite: true };
}

function initContainer(forceFresh = false): DbContainer {
  if (!forceFresh && globalForDb.__arenaDbContainer) {
    return globalForDb.__arenaDbContainer;
  }

  // Se è richiesto esplicitamente PostgreSQL (e non è il default locale 127.0.0.1 che fallisce), proviamo PG
  if (databaseUrl && !usePgliteExplicit && !isLocalDefaultPg) {
    try {
      const pool = new Pool({ connectionString: databaseUrl, connectionTimeoutMillis: 3000 });
      const db = drizzlePg(pool, { schema });
      const container: DbContainer = { db, pool, isPglite: false };
      globalForDb.__arenaDbContainer = container;
      return container;
    } catch (e) {
      console.warn("PostgreSQL connection failed, falling back to embedded PGlite:", e);
    }
  }

  // Modalità Embedded PGlite (Zero-config, self-contained, compatibilità 100% PostgreSQL WASM)
  const container = createPgliteContainer();
  globalForDb.__arenaDbContainer = container;
  return container;
}

let container = initContainer();

export function getContainer(): DbContainer {
  if (!globalForDb.__arenaDbContainer) {
    globalForDb.__arenaDbContainer = initContainer();
  }
  return globalForDb.__arenaDbContainer;
}

// Proxy trasparente per consentire il re-binding automatico se il container si rigenera dopo un crash
export const db = new Proxy({} as ReturnType<typeof drizzlePg>, {
  get(_target, prop) {
    const c = getContainer();
    const val = (c.db as any)[prop];
    if (typeof val === "function") {
      return val.bind(c.db);
    }
    return val;
  },
});

export const pool = container.pool;
export const pglite = container.pglite;
export const isPglite = container.isPglite;

/** Inizializzazione idempotente dello schema e delle tabelle se non ancora presenti */
export async function ensureDbReady(): Promise<void> {
  const c = getContainer();
  // Se già avviato, facciamo un probe rapido per verificare che l'istanza WASM sia viva e non abortita
  try {
    if (c.pglite) {
      await (c.pglite as any).query("SELECT 1");
      c.ready = true;
      return;
    } else if (c.pool) {
      return;
    }
  } catch (probeErr) {
    console.warn("PGlite non risponde o era in stato di abort WASM, avvio recupero...", probeErr);
    c.initPromise = undefined;
    c.ready = false;
  }

  if (!c.initPromise) {
    c.initPromise = (async () => {
      try {
        if (c.pglite) {
          try {
            await c.pglite.exec(SCHEMA_DDL);
            c.ready = true;
          } catch (execErr: any) {
            console.warn("Errore o crash WASM rilevato in PGlite:", execErr?.message || execErr);
            console.warn("Avvio auto-ripristino database PGlite pulito...");
            const dataDir = path.resolve(process.cwd(), ".data", "pglite-db");
            try {
              if (c.pglite && typeof (c.pglite as any).close === "function") {
                await (c.pglite as any).close().catch(() => {});
              }
            } catch {}
            cleanStalePid(dataDir);
            const fresh = createPgliteContainer();
            c.pglite = fresh.pglite;
            c.db = fresh.db;
            container = c;
            globalForDb.__arenaDbContainer = c;
            await fresh.pglite.exec(SCHEMA_DDL);
            c.ready = true;
            console.log("PGlite ripristinato con successo!");
          }
        } else if (c.pool) {
          const client = await c.pool.connect();
          try {
            await client.query(SCHEMA_DDL);
            c.ready = true;
          } finally {
            client.release();
          }
        }
      } catch (err) {
        c.initPromise = undefined;
        c.ready = false;
        console.error("Errore durante l'inizializzazione dello schema database:", err);
        throw err;
      }
    })();
  }
  return c.initPromise;
}

// Pulizia automatica su chiusura processo Node
if (typeof process !== "undefined" && !process.env.__ARENA_SHUTDOWN_REGISTERED) {
  process.env.__ARENA_SHUTDOWN_REGISTERED = "true";
  const cleanup = () => {
    try {
      const dataDir = path.resolve(process.cwd(), ".data", "pglite-db");
      cleanStalePid(dataDir);
    } catch {}
  };
  process.on("exit", cleanup);
  process.on("SIGINT", () => {
    cleanup();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    cleanup();
    process.exit(0);
  });
}

