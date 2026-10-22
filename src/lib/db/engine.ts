import type { Database, SqlJsStatic } from "sql.js";
import type { ForeignKeyDefinition, TableDefinition } from "@/types/database";

let sqlPromise: Promise<SqlJsStatic> | undefined;
let database: Database | undefined;

async function getSql(): Promise<SqlJsStatic> {
  if (!sqlPromise) {
    sqlPromise = (async () => {
      // Fetch the WASM explicitly: relying on Emscripten's streaming fetch can
      // fail behind Next dev proxies, base paths, or static hosting rewrites.
      const wasmUrl = new URL("sql-wasm.wasm", document.baseURI);
      const response = await fetch(wasmUrl);
      if (!response.ok) {
        throw new Error(`Não foi possível carregar o SQLite WebAssembly (${response.status} ${response.statusText}) em ${wasmUrl.pathname}.`);
      }
      const wasmBinary = new Uint8Array(await response.arrayBuffer());
      const { default: initSqlJs } = await import("sql.js");
      return initSqlJs({ wasmBinary: wasmBinary.buffer as ArrayBuffer, locateFile: () => wasmUrl.href });
    })().catch((error: unknown) => {
      // Allow retry after correcting a transient asset/network issue.
      sqlPromise = undefined;
      throw error;
    });
  }
  return sqlPromise;
}

export async function getDatabase(): Promise<Database> {
  if (!database) {
    const SQL = await getSql();
    database = new SQL.Database();
  }
  return database;
}

export async function executeSql(sql: string) {
  const db = await getDatabase();
  const startedAt = performance.now();
  const results = db.exec(sql);
  const durationMs = Math.round((performance.now() - startedAt) * 100) / 100;
  const last = results.at(-1);
  return {
    columns: last?.columns ?? [],
    values: (last?.values ?? []) as (string | number | null)[][],
    durationMs,
    rowCount: last?.values.length ?? 0,
  };
}

export async function getSchema(): Promise<TableDefinition[]> {
  const db = await getDatabase();
  const tables = db.exec(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name;",
  );

  return tables.flatMap((result) =>
    result.values.map((row, index) => {
      const name = String(row[0]);

      const tableName = `"${name.replaceAll('"', '""')}"`;
      const columnResults = db.exec(`PRAGMA table_info(${tableName});`);
      const columns = (columnResults[0]?.values ?? []).map((column) => ({
        name: String(column[1]),
        type: String(column[2] ?? ""),
        nullable: Number(column[3]) === 0,
        primaryKey: Number(column[5]) > 0,
      }));
      const countResults = db.exec(`SELECT COUNT(*) FROM ${tableName};`);

      return {
        id: name,
        name,
        columns,
        position: { x: 100 + (index % 3) * 280, y: 100 + Math.floor(index / 3) * 220 },
        rowCount: Number(countResults[0]?.values[0]?.[0] ?? 0),
      };
    }),
  );
}

export async function getForeignKeys(tableName: string): Promise<ForeignKeyDefinition[]> {
  const db = await getDatabase();
  const tableNameEscaped = `"${tableName.replaceAll('"', '""')}"`;
  const results = db.exec(`PRAGMA foreign_key_list(${tableNameEscaped});`);

  return (results[0]?.values ?? []).map((row, index) => ({
    id: String(index),
    tableOrigin: String(tableName),
    table: String(row[2]),
    from: String(row[3]),
    to: String(row[4]),
  }));
}

export async function executeBatch(sql: string) {
  const db = await getDatabase();
  db.run(sql);
}

export async function importDatabase(bytes: Uint8Array) {
  const SQL = await getSql();
  database?.close();
  database = new SQL.Database(bytes);
}

export async function exportDatabase() {
  return (await getDatabase()).export();
}

export async function resetDatabase() {
  database?.close();
  const SQL = await getSql();
  database = new SQL.Database();
}
