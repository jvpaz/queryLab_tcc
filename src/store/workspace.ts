import { create } from "zustand";
import type { QueryResult, TableDefinition } from "@/types/database";

type WorkspaceState = {
  sql: string;
  tables: TableDefinition[];
  selectedTableId: string | null;
  result: QueryResult | null;
  queryError: string | null;
  isRunning: boolean;
  setSql: (sql: string) => void;
  setTables: (tables: TableDefinition[]) => void;
  setSelectedTableId: (id: string | null) => void;
  runStarted: () => void;
  setResult: (result: QueryResult) => void;
  setQueryError: (error: string | null) => void;
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  sql: "",
  tables: [],
  selectedTableId: null,
  result: null,
  queryError: null,
  isRunning: false,
  setSql: (sql) => set({ sql }),
  setTables: (tables) => set({ tables }),
  setSelectedTableId: (selectedTableId) => set({ selectedTableId }),
  runStarted: () => set({ isRunning: true, queryError: null }),
  setResult: (result) => set({ result, isRunning: false, queryError: null }),
  setQueryError: (queryError) => set({ queryError, isRunning: false }),
}));
