import { executeSql, getSchema, getForeignKeys } from "@/lib/db/engine";
import { useWorkspaceStore } from "@/store/workspace";
import { ForeignKeyDefinition } from "@/types/database";
import { sql } from "@electric-sql/pglite/template";
import { useCallback } from "react";
import { TableFlowNode } from "../components/TableNode";
import { Edge } from "@xyflow/react";

type QueryHooksProps = {
    nodes: TableFlowNode[];
    setNodes: (nodes: TableFlowNode[]) => void;
    edges: Edge[];
    setEdges: (edges: Edge[]) => void;
}

export function useQueryHooks({nodes, setNodes, edges, setEdges}: QueryHooksProps) {
    
  const runStarted = useWorkspaceStore((state) => state.runStarted);
  const setResult = useWorkspaceStore((state) => state.setResult);
  const sql = useWorkspaceStore((state) => state.sql);
  const setQueryError = useWorkspaceStore((state) => state.setQueryError);
  const tables = useWorkspaceStore((state) => state.tables);
  const setTables = useWorkspaceStore((state) => state.setTables);

    const runQuery = useCallback(async () => {
        if (!sql.trim()) return;
        runStarted();
        try {
          const queryResult = await executeSql(sql);
          const schema = await getSchema();
          const previousPositions = new Map(
            nodes.map((node) => [node.id, node.position]),
          );
          const savedTables = new Map(tables.map((table) => [table.id, table]));
          const updatedTables = schema.map((table) => ({
            ...table,
            position:
              previousPositions.get(table.id) ??
              savedTables.get(table.id)?.position ??
              table.position,
          }));
    
          setTables(updatedTables);
          setNodes(
            updatedTables.map((table) => ({
              id: table.id,
              type: "table",
              position: table.position,
              data: table,
            })),
          );
    
        /*  const previousForeignKeys = edges.map((edge) => ({
            id: edge.id,
            tableOrigin: edge.source,
            table: edge.target,
          })); */
    
          const updatedForeignKeys: ForeignKeyDefinition[] = [];
          for (const table of updatedTables) {
            const foreignKeys = await getForeignKeys(table.name);
    
            updatedForeignKeys.push(...foreignKeys);
          }
    
          console.log("Updated Foreign Keys:", updatedForeignKeys);
    
          setEdges(updatedForeignKeys.map((fk, index) => ({
            id: fk.id,
            source: fk.tableOrigin,
            target: fk.table,
            sourceHandle: fk.to,
            type: "relation",
          })));
    
          console.log("Updated Edges:", edges);
    
          setResult(queryResult);
        } catch (error) {
          setQueryError(
            error instanceof Error ? error.message : "Erro ao executar SQL.",
          );
        }
      }, [nodes, runStarted, setNodes, setQueryError, setResult, setTables, sql, tables]);

    return { runQuery };
}