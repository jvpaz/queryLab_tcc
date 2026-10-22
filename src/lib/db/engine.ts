import type { Database, SqlJsStatic } from "sql.js";
import type { ForeignKeyDefinition, TableDefinition } from "@/types/database";
import initSqlJs from "sql.js";

//TODO - Adicionar função para trazer schema de banco de dados já existente no indexedDB, incluindo tabelas, colunas e chaves estrangeiras.

let sqlPromise: Promise<SqlJsStatic> | undefined;
let database: Database | undefined;

// Função para carregar o módulo SQL.js e inicializar o banco de dados SQLite em memória, seguindo exemplo da documentação.
async function getSql(): Promise<SqlJsStatic> {
  if (!sqlPromise) {
    sqlPromise = (async () => {

      const wasmUrl = new URL("sql-wasm.wasm", document.baseURI);
      const response = await fetch(wasmUrl);
      if (!response.ok) {
        throw new Error(`Não foi possível carregar o SQLite WebAssembly (${response.status} ${response.statusText}) em ${wasmUrl.pathname}.`);
      }
      return initSqlJs({locateFile: () => wasmUrl.href });
    })().catch((error: unknown) => {

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

  return Promise.all(
    tables.flatMap((result) =>
      result.values.map(async (row, index) => {
        const name = String(row[0]);

        const tableName = `"${name.replaceAll('"', '""')}"`;
        const columnResults = db.exec(`PRAGMA table_info(${tableName});`);

        const columns = (columnResults[0]?.values ?? []).map(async (column) => ({
          name: String(column[1]),
          type: String(column[2] ?? ""),
          nullable: Number(column[3]) === 0,
          primaryKey: Number(column[5]) > 0,
          foreignKey: await isForeignKey(name, String(column[1])),
        }));

        const countResults = db.exec(`SELECT COUNT(*) FROM ${tableName};`);
        const resolvedColumns = await Promise.all(columns);

        return {
          id: name,
          name,
          columns: resolvedColumns,
          position: {
            x: 100 + (index % 3) * 280,
            y: 100 + Math.floor(index / 3) * 220,
          },
          rowCount: Number(countResults[0]?.values[0]?.[0] ?? 0),
        };
      }),
    ),
  );
}

export async function getForeignKeys(tableName: string): Promise<ForeignKeyDefinition[]> {
  const db = await getDatabase();
  const tableNameEscaped = `"${tableName.replaceAll('"', '""')}"`;
  const results = db.exec(`PRAGMA foreign_key_list(${tableNameEscaped});`);

  return (results[0]?.values ?? []).map((row, index) => ({
    id:`${tableName}.${String(row[3])}->${String(row[2])}.${String(row[4])}`,
    tableOrigin: String(tableName),
    table: String(row[2]),
    from: String(row[3]),
    to: String(row[4]),
  }));
}

export async function isForeignKey(tableName: string, columnName: string): Promise<boolean> {
  const foreignKeys = await getForeignKeys(tableName);
  return foreignKeys.some((fk) => fk.from === columnName);
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
