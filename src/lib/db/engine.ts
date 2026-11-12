import { PGlite } from "@electric-sql/pglite";
import type { ForeignKeyDefinition, TableDefinition } from "@/types/database";
import { pgDump } from "@electric-sql/pglite-tools/pg_dump";

let databasePromise: Promise<PGlite> | undefined;

export async function getDatabase(): Promise<PGlite> {
  if (!databasePromise) {
    databasePromise = PGlite.create().catch((error: unknown) => {
      databasePromise = undefined;
      throw error;
    });
  }
  return databasePromise;
}

export async function executeSql(sql: string) {
  const db = await getDatabase();
  const startedAt = performance.now();
  const results = await db.exec(sql);
  const durationMs = Math.round((performance.now() - startedAt) * 100) / 100;
  const last = results.at(-1);
  const values = (last?.rows ?? []).map((row) => Object.values(row)) as (string | number | null)[][];
  return {
    columns: last?.fields.map((field) => field.name) ?? [],
    values,
    durationMs,
    rowCount: last?.affectedRows ?? values.length,
  };
}

export async function getSchema(): Promise<TableDefinition[]> {
  const db = await getDatabase();
  const tables = await db.query<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
     ORDER BY table_name;`,
  );

  return Promise.all(
    tables.rows.map(async ({ table_name: name }, index) => {
      const columnsResult = await db.query<{
        column_name: string;
        data_type: string;
        is_nullable: string;
        is_primary: boolean;
        is_foreign: boolean;
      }>(
        `SELECT c.column_name, c.data_type, c.is_nullable,
          COALESCE(bool_or(tc.constraint_type = 'PRIMARY KEY'), false) AS is_primary,
          COALESCE(bool_or(tc.constraint_type = 'FOREIGN KEY'), false) AS is_foreign
         FROM information_schema.columns c
         LEFT JOIN information_schema.key_column_usage kcu
           ON kcu.table_schema = c.table_schema AND kcu.table_name = c.table_name
          AND kcu.column_name = c.column_name
         LEFT JOIN information_schema.table_constraints tc
           ON tc.constraint_schema = kcu.constraint_schema AND tc.constraint_name = kcu.constraint_name
          AND tc.table_name = kcu.table_name
         WHERE c.table_schema = 'public' AND c.table_name = $1
         GROUP BY c.ordinal_position, c.column_name, c.data_type, c.is_nullable
         ORDER BY c.ordinal_position;`,
        [name],
      );
      const quote = (identifier: string) => `"${identifier.replaceAll('"', '""')}"`;
      const countResult = await db.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM ${quote(name)};`,
      );

      return {
        id: name,
        name,
        columns: columnsResult.rows.map((column) => ({
          name: column.column_name,
          type: column.data_type,
          nullable: column.is_nullable === "YES",
          primaryKey: column.is_primary,
          foreignKey: column.is_foreign,
        })),
        position: {
          x: 100 + (index % 3) * 280,
          y: 100 + Math.floor(index / 3) * 220,
        },
        rowCount: Number(countResult.rows[0]?.count ?? 0),
      };
    }),
  );
}

export async function getForeignKeys(tableName: string): Promise<ForeignKeyDefinition[]> {
  const db = await getDatabase();
  const result = await db.query<{
    constraint_name: string;
    target_table: string;
    source_column: string;
    target_column: string;
  }>(
    `SELECT con.conname AS constraint_name, target.relname AS target_table,
       source_col.attname AS source_column, target_col.attname AS target_column
     FROM pg_constraint con
     JOIN pg_class source ON source.oid = con.conrelid
     JOIN pg_namespace ns ON ns.oid = source.relnamespace
     JOIN pg_class target ON target.oid = con.confrelid
     JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS source_key(attnum, ord) ON true
     JOIN LATERAL unnest(con.confkey) WITH ORDINALITY AS target_key(attnum, ord) ON target_key.ord = source_key.ord
     JOIN pg_attribute source_col ON source_col.attrelid = source.oid AND source_col.attnum = source_key.attnum
     JOIN pg_attribute target_col ON target_col.attrelid = target.oid AND target_col.attnum = target_key.attnum
     WHERE con.contype = 'f' AND ns.nspname = 'public' AND source.relname = $1
     ORDER BY con.conname, source_key.ord;`,
    [tableName],
  );

  return result.rows.map((row) => ({
    id: `${tableName}.${row.source_column}->${row.target_table}.${row.target_column}`,
    tableOrigin: tableName,
    table: row.target_table,
    from: row.source_column,
    to: `${tableName}.${row.source_column}-right`,
  }));
}

export async function isForeignKey(tableName: string, columnName: string): Promise<boolean> {
  const foreignKeys = await getForeignKeys(tableName);
  return foreignKeys.some((fk) => fk.from === columnName);
}

export async function executeBatch(sql: string) {
  const db = await getDatabase();
  await db.exec(sql);
}



export async function importDatabase(bytes: Uint8Array) {
  const db = await getDatabase();
  await db.exec(new TextDecoder().decode(bytes));
}

export async function exportDatabase() {
  const db = await getDatabase();

  try {
    return await pgDump({ pg: db, fileName: "querylab.sql" });
  } finally {

    try {
      //Garante que pgDump não trave a conexão com o banco de dados, mesmo que ocorra algum erro durante a exportação.
      await db.exec("COMMIT");
    } catch {

    }
  }
}

export async function resetDatabase() {
  const previous = databasePromise;
  databasePromise = undefined;
  if (previous) await (await previous).close();
}
