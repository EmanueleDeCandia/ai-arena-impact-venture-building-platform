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
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaDbContainer?: DbContainer;
};

function initContainer(): DbContainer {
  if (globalForDb.__arenaDbContainer) {
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
  const dataDir = path.resolve(process.cwd(), ".data", "pglite-db");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const pglite = new PGlite(dataDir);
  const db = drizzlePglite(pglite, { schema });
  const container: DbContainer = { db, pglite, isPglite: true };
  globalForDb.__arenaDbContainer = container;
  return container;
}

const container = initContainer();

export const db = container.db;
export const pool = container.pool;
export const pglite = container.pglite;
export const isPglite = container.isPglite;

/** Inizializzazione idempotente dello schema e delle tabelle se non ancora presenti */
export async function ensureDbReady(): Promise<void> {
  if (!container.initPromise) {
    container.initPromise = (async () => {
      try {
        if (container.pglite) {
          // Esegue il DDL direttamente in PGlite
          await container.pglite.exec(SCHEMA_DDL);
        } else if (container.pool) {
          const client = await container.pool.connect();
          try {
            await client.query(SCHEMA_DDL);
          } finally {
            client.release();
          }
        }
      } catch (err) {
        console.error("Errore durante l'inizializzazione dello schema database:", err);
      }
    })();
  }
  return container.initPromise;
}
