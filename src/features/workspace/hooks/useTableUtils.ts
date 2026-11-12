import { executeBatch } from "@/lib/db/engine";
import { useCallback } from "react";
import { TableFlowNode } from "../components/TableNode";
import { TableDefinition } from "@/types/database";
import { generateRows } from "@/lib/data/generate";

type TableUtilsProps = {
    tables:  TableDefinition[];
    setTables: (tables: TableDefinition[]) => void;
    setNodes: (nodes: any) => void;
    notify: (message: string) => void;
    rowCount?: number;
}

export function useTableUtils({tables, setTables, setNodes, notify, rowCount}: TableUtilsProps)
{

    const insertTable = useCallback(() => {
        const name = `nova_tabela_${tables.length + 1}`;
        const table = {
          id: name,
          name,
          position: {
            x: 100 + (tables.length % 3) * 260,
            y: 80 + Math.floor(tables.length / 3) * 210,
          },
          rowCount: 0,
          columns: [
            { name: "id", type: "integer", primaryKey: true },
            { name: "nome", type: "text" },
          ],
        };
        executeBatch(
          `CREATE TABLE "${name}" (id INTEGER PRIMARY KEY, nome TEXT);`,
        );
        setTables([...tables, table]);
        setNodes((current: any) => [
          ...current,
          { id: table.id, type: "table", position: table.position, data: table },
        ]);
        notify(`Tabela ${name} adicionada ao diagrama.`);
      }, [notify, setNodes, setTables, tables]);

    const deleteTables = useCallback(
    (deletedNodes: TableFlowNode[]) => {
      const deletedIds = new Set(deletedNodes.map((node) => node.id));
      setTables(tables.filter((table) => !deletedIds.has(table.id)));
      Promise.all(
        deletedNodes.map((node) =>
          executeBatch(
            `DROP TABLE IF EXISTS "${node.data.name.replaceAll('"', '""')}" CASCADE;`,
          ),
        ),
      ).catch((error) => {
        console.error("Não foi possível excluir a tabela do banco:", error);
        notify("Não foi possível excluir a tabela do banco.");
      });
      notify(
        deletedNodes.length === 1
          ? `Tabela ${deletedNodes[0].data.name} excluída.`
          : `${deletedNodes.length} tabelas excluídas.`,
      );
    },
    [notify, setTables, tables],
  );

    const generate = useCallback(async () => {
    const table = tables[0];
    if (!table) return;
    try {
      await generateRows(table, rowCount || 10);
      notify(`${rowCount} registros gerados em ${table.name}.`);
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Falha ao gerar os dados.",
      );
    }
  }, [notify, rowCount, tables]);

    return { insertTable, deleteTables, generate };
}