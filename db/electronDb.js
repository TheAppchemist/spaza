/**
 * SQLite for Electron via sql.js. Call initElectronDb(migrationSql, setElectronDb) from App.
 * Persists to disk via IPC (electronDbLoad / electronDbSave). Use saveElectronDb() to flush.
 */
import * as schema from "./schema";

let sqliteDbRef = null;

function runMigrationSql(sqliteDb, migrationSql) {
  const statements = migrationSql
    .split(/--> statement-breakpoint\n?/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const stmt of statements) {
    sqliteDb.run(stmt);
  }
}

function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function uint8ArrayToBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export async function initElectronDb(migrationSql, setElectronDb) {
  const initSqlJs = (await import("sql.js")).default;
  const SQL = await initSqlJs({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/sql.js@1.14.0/dist/${file}`,
  });

  let sqliteDb;
  const base64 = typeof window !== "undefined" && window.electronDbLoad ? await window.electronDbLoad() : null;
  if (base64) {
    try {
      const data = base64ToUint8Array(base64);
      sqliteDb = new SQL.Database(data);
    } catch (e) {
      console.warn("Failed to load persisted DB, starting fresh:", e);
      sqliteDb = new SQL.Database();
      runMigrationSql(sqliteDb, migrationSql);
    }
  } else {
    sqliteDb = new SQL.Database();
    runMigrationSql(sqliteDb, migrationSql);
  }

  sqliteDbRef = sqliteDb;
  const { drizzle } = await import("drizzle-orm/sql-js");
  const d = drizzle(sqliteDb, { schema });
  setElectronDb(d);
}

/**
 * Export the current DB to disk (Electron only). Call periodically or on beforeunload.
 */
export async function saveElectronDb() {
  if (!sqliteDbRef || typeof window === "undefined" || !window.electronDbSave) return;
  try {
    const data = sqliteDbRef.export();
    const base64 = uint8ArrayToBase64(data);
    await window.electronDbSave(base64);
  } catch (e) {
    console.error("Failed to save Electron DB:", e);
  }
}
