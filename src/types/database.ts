export type ColumnDefinition = {
  name: string;
  type: string;
  primaryKey?: boolean;
  nullable?: boolean;
};
export type TableDefinition = {
  id: string;
  name: string;
  columns: ColumnDefinition[];
  position: { x: number; y: number };
  rowCount?: number;
};
export type QueryResult = {
  columns: string[];
  values: (string | number | null)[][];
  durationMs: number;
  rowCount: number;
};

export type ForeignKeyDefinition = {
  id: string;
  tableOrigin: string;
  table: string;
  from: string;
  to: string;
};

export type WorkspaceSnapshot = {
  id: string;
  name: string;
  sql: string;
  tables: TableDefinition[];
  updatedAt: number;
};
