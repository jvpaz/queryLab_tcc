"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Connection,
  type Edge,
  addEdge,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import {
  Braces,
  CircleHelp,
  Download,
  Play,
  Plus,
  Save,
  Settings2,
  Table2,
  WandSparkles,
} from "lucide-react";
import { executeBatch, executeSql, exportDatabase, getDatabase, getForeignKeys, getSchema } from "@/lib/db/engine";
import { generateRows } from "@/lib/data/generate";
import { saveWorkspace } from "@/lib/storage/workspaces";
import { useWorkspaceStore } from "@/store/workspace";
import { sampleTables, seedSql } from "../sample";
import TableNode, { type TableFlowNode } from "./TableNode";
import { ForeignKeyDefinition } from "@/types/database";
import { handleEdgeConnection } from "../utils/handleEdgeConnection";
import RelationEdge from "./RelationEdge";
import RelationModal from "./RelationModal";
const nodeTypes = { table: TableNode };
const edgeTypes = { relation: RelationEdge };

// TODO - Tirar isso daqui quando tiver tempo

const seedDatabase: boolean = false;
console.log("Seed database:", seedDatabase);
const initialSql =
  "SELECT\n  c.name AS cliente,\n  COUNT(o.id) AS total_pedidos,\n  ROUND(SUM(o.total), 2) AS valor_total\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nGROUP BY c.id\nORDER BY valor_total DESC;";
const initialEdges: Edge[] = [
  {
    id: "0",
    source: "customers",
    target: "orders",
    label: "1 : N",
    type: "smoothstep",
    style: { stroke: "#596373" },
    labelStyle: { fill: "#a5adba", fontSize: 10 },
  },
  {
    id: "1",
    source: "orders",
    target: "order_items",
    label: "1 : N",
    type: "smoothstep",
    style: { stroke: "#596373" },
    labelStyle: { fill: "#a5adba", fontSize: 10 },
  },
  {
    id: "2",
    source: "products",
    target: "order_items",
    label: "1 : N",
    type: "smoothstep",
    style: { stroke: "#596373" },
    labelStyle: { fill: "#a5adba", fontSize: 10 },
  },
];

export function QueryLab() {
  const sql = useWorkspaceStore((state) => state.sql);
  const setSql = useWorkspaceStore((state) => state.setSql);
  const tables = useWorkspaceStore((state) => state.tables);
  const setTables = useWorkspaceStore((state) => state.setTables);
  const result = useWorkspaceStore((state) => state.result);
  const queryError = useWorkspaceStore((state) => state.queryError);
  const isRunning = useWorkspaceStore((state) => state.isRunning);
  const runStarted = useWorkspaceStore((state) => state.runStarted);
  const setResult = useWorkspaceStore((state) => state.setResult);
  const setQueryError = useWorkspaceStore((state) => state.setQueryError);
  const [nodes, setNodes, onNodesChange] = useNodesState<TableFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(seedDatabase ? initialEdges : []);
  const [notice, setNotice] = useState("");
  const [edgeForRelationType, setEdgeForRelationType] = useState<Edge | null>(null);
  const [relationType, setRelationType] = useState("1:N");
  const [relationModalPosition, setRelationModalPosition] = useState({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);
  const [rowCount, setRowCount] = useState(20);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const edgeTypesMap = useMemo(() => edgeTypes, []);
  const nodeTypesMap = useMemo(() => nodeTypes, []);


//TODO - Mover funções e afins para um hook dedicado, para não poluir o componente principal.
//TODO - Quebrar o componente em subcomponentes no futuro, para não poluir o componente principal.

  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        await getDatabase();
        if (seedDatabase) {
          await executeBatch(seedSql);
        }
        if (!active) return;

        if(seedDatabase) {
        setTables(sampleTables);

        setNodes(
          sampleTables.map((table) => ({
            id: table.id,
            type: "table",
            position: table.position,
            data: table,
          })),
        );
        
        setSql(seedDatabase ? initialSql : "");
      }
        setReady(true);
      } catch (error) {
        setQueryError(
          error instanceof Error ? error.message : "Falha ao iniciar PostgreSQL.",
        );
      }
    }
    void initialize();
    return () => {
      active = false;
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, [setNodes, setQueryError, setSql, setTables]);

  const notify = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 2400);
  }, []);

  const onConnect = useCallback(
    async (connection: Connection) => {


      const ok = await handleEdgeConnection(connection);
    if (!ok) return;

      setEdges((current) =>
        addEdge(
          { ...connection, type: "relation", style: { stroke: "#596373" } },
          current,
        ),
      )

    },
    [setEdges, handleEdgeConnection],
  );

  const onEdgeClick = useCallback(
    (event: ReactMouseEvent, edge: Edge) => {
      setEdgeForRelationType(edge);
      setRelationType(String(edge.label ?? "1:N"));
      setRelationModalPosition({ x: event.clientX, y: event.clientY });
    },
    [],
  );

  const saveRelationType = useCallback((relationType: string) => {
    if (!edgeForRelationType) return;

    setEdges((current) =>
      current.map((edge) =>
        edge.id === edgeForRelationType.id
          ? { ...edge, label: relationType }
          : edge,
      ),
    );
    setEdgeForRelationType(null);
  }, [edgeForRelationType, relationType, setEdges]);


  // TODO - Função feia da desgraça que faz 1 bilhão de coisas ao mesmo tempo, quebrar ela em funções menores e passar tudo isso pra um hook.
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


  //TODO - PGlite possui salvamento próprio, adaptar para ele depois
  const save = useCallback(async () => {
    try {
      await saveWorkspace({
        id: "default",
        name: "Meu workspace",
        sql,
        tables,
        updatedAt: Date.now(),
      });
      notify("Salvamento de workspace ainda em desenvolvimento.");
    } catch {
      notify("Não foi possível salvar no navegador.");
    }
  }, [notify, sql, tables]);

  const downloadDb = useCallback(async () => {
    try {
      const bytes = await exportDatabase();
      const url = URL.createObjectURL(bytes);
      const link = document.createElement("a");
      link.href = url;
      link.download = bytes.name || "querylab.sql";
      link.click();
      URL.revokeObjectURL(url);
      notify("Banco exportado.");
    } catch {
      notify("Não foi possível exportar o banco.");
    }
  }, [notify]);

  const generate = useCallback(async () => {
    const table = tables[0];
    if (!table) return;
    try {
      await generateRows(table, rowCount);
      notify(`${rowCount} registros gerados em ${table.name}.`);
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Falha ao gerar os dados.",
      );
    }
  }, [notify, rowCount, tables]);

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
    setNodes((current) => [
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

  const hasResult = !!result && result.columns.length > 0;

  return (
    <main className="app-shell" onClick={edgeForRelationType ? () => setEdgeForRelationType(null) : undefined} onDrag={edgeForRelationType ? () => setEdgeForRelationType(null) : undefined}>
      <a className="skip-link" href="#sql-editor">Pular para o editor SQL</a>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <Braces size={16} />
          </span>
          <span>
            querylab<small> / Simulador</small>
          </span>
        </div>
        <div className="top-actions">
          <span className="status-pill">
            <i className="dot" />
            {ready ? "PostgreSQL local ativo" : "Iniciando banco…"}
          </span>
          <button className="btn btn-ghost" aria-label="Ajuda">
            <CircleHelp size={15} />
          </button>
          <button className="btn" onClick={save}>
            <Save size={14} />
            Salvar
          </button>
          <button className="btn btn-primary" onClick={downloadDb}>
            <Download size={14} />
            Exportar .sql
          </button>
        </div>
      </header>
      <div className="toolbar">
        <div className="toolbar-group">
          <span className="muted" style={{ fontSize: 10 }}>
            ● Salvo localmente
          </span>
        </div>
        <div className="toolbar-group">
          <span className="toolbar-label">Adicionar ao canvas</span>
          <button className="btn btn-ghost" onClick={insertTable}>
            <Plus size={14} />
            Tabela
          </button>
          <button
            className="btn btn-ghost"
            onClick={() =>
              notify(
                "Importação de schema ainda em desenvolvimento!",
              )
            }
          >
            <Download size={14} />
            Importar SQL
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => notify("Configurações ainda em desenvolvimento!")}
          >
            <Settings2 size={14} />
          </button>
        </div>
      </div>
      <div className="workspace">
        <section className="canvas-section">
          <div className="workspace-title">
            <div className="workspace-title">
              <Table2 size={15} color="var(--accent)" />
              <h1>Diagrama do banco</h1>
              <span className="muted" style={{ fontSize: 11 }}>
                {tables.length} tabelas · PostgreSQL
              </span>
            </div>
            <div className="toolbar-group">
              <button
                className="btn btn-ghost"
                onClick={() =>
                  notify("Organização automática ainda em desenvolvimento!")
                }
              >
                Organizar
              </button>
              <button className="btn btn-ghost" onClick={insertTable}>
                <Plus size={14} />
                Tabela
              </button>
            </div>
          </div>
          <div className="canvas" aria-label="Diagrama visual do banco de dados">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onNodesDelete={deleteTables}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onEdgeClick={onEdgeClick}
              nodeTypes={nodeTypesMap}
              edgeTypes={edgeTypesMap}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.25}
              maxZoom={1.6}
              proOptions={{ hideAttribution: true }}
              deleteKeyCode="Delete"
            >
              <Background color="#303540" gap={20} size={1} />
              <Controls />
              <MiniMap nodeColor="#333b49" maskColor="#111318cc" />
            </ReactFlow>
          </div>
          <div className="schema-panel">
            <div className="schema-header">
              <h2>Estrutura do schema</h2>
              <span className="muted" style={{ fontWeight: 400 }}>
                {tables.length} tabelas ·{" "}
                {tables.reduce((n, table) => n + table.columns.length, 0)}{" "}
                colunas
              </span>
            </div>
            <div className="schema-content">
              {tables.length ? <ul className="schema-list">
                {tables.map((table) => (
                  <li className="schema-card" key={table.id}>
                    <h3>{table.name}</h3>
                    <ul className="schema-columns">
                      {table.columns.map((column) => <li key={column.name}>
                        <span>{column.name}</span><span>{column.type}</span>
                        {column.primaryKey && <span>chave primária</span>}
                        {column.foreignKey && <span>chave estrangeira</span>}
                      </li>)}
                    </ul>
                    <span>{table.columns.length} colunas, {table.rowCount ?? 0} linhas</span>
                  </li>
                ))}
              </ul> : <p className="schema-empty">Nenhuma tabela no schema.</p>}
            </div>
          </div>
        </section>
        <aside className="panel">
          <div className="panel-title">
            <span>Editor SQL</span>
            <span className="muted" style={{ fontSize: 10, fontWeight: 400 }}>
              PostgreSQL · PGlite
            </span>
          </div>
          <div className="editor-wrap" id="sql-editor">
            <div className="editor-head">
              <span>query.sql</span>
              <div className="editor-actions">
                <button
                  className="icon-button"
                  title="Formatar SQL"
                  aria-label="Formatar SQL"
                  onClick={() => setSql(sql.trim())}
                >
                  <Braces size={14} />
                </button>
                <button
                  className="icon-button"
                  title="Gerar dados"
                  aria-label="Gerar dados na primeira tabela"
                  onClick={() => notify("Gerar dados ainda em desenvolvimento!")}
                >
                  <WandSparkles size={14} />
                </button>
              </div>
            </div>
            <textarea
              className="sql-editor"
              spellCheck={false}
              value={sql}
              onChange={(event) => setSql(event.target.value)}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                  event.preventDefault();
                  void runQuery();
                }
              }}
              aria-label="Editor de consulta SQL"
            />
            <div className="editor-foot">
              <span>⌘ / Ctrl + Enter para executar</span>
              <div className="editor-actions">
                <select
                  className="select"
                  value={rowCount}
                  onChange={(event) => setRowCount(Number(event.target.value))}
                  aria-label="Quantidade de registros"
                >
                  <option value={10}>10 linhas</option>
                  <option value={20}>20 linhas</option>
                  <option value={100}>100 linhas</option>
                </select>
                <button
                  className="btn btn-primary"
                  onClick={runQuery}
                  disabled={isRunning || !ready}
                >
                  <Play size={13} fill="currentColor" />
                  {isRunning ? "Executando" : "Executar"}
                </button>
              </div>
            </div>
          </div>
          <div className="result-area" aria-labelledby="result-heading">
            <div className="result-head">
              <h2 className="tab" id="result-heading">Resultado</h2>
              <span className="result-meta">
                {result
                  ? `${result.rowCount} linhas · ${result.durationMs} ms`
                  : "aguardando consulta"}
              </span>
            </div>
            <div className="result-scroll">
              {queryError ? (
                <div className="result-error">{queryError}</div>
              ) : hasResult ? (
                <table className="result-table">
                  <thead>
                    <caption className="sr-only">Resultado da consulta SQL, {result.rowCount} linhas</caption>
                    <tr>
                      {result.columns.map((column) => (
                        <th key={column} scope="col">{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.values.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((value, columnIndex) => (
                          <td key={`${rowIndex}-${columnIndex}`}>
                            {value === null ? "NULL" : String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="result-empty">
                  <strong>Pronto para consultar</strong>Escreva uma consulta SQL
                  e pressione Executar. O resultado aparece aqui.
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
      {edgeForRelationType && 
        <RelationModal 
          relationModalPosition={relationModalPosition}
          relationType={relationType}
          saveRelationType={saveRelationType}
        />
      }
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {notice || (isRunning ? "Executando consulta SQL." : "")}
        {result && !isRunning && !queryError ? ` Consulta concluída: ${result.rowCount} linhas retornadas em ${result.durationMs} milissegundos.` : ""}
      </div>
      {queryError && <div className="sr-only" role="alert">Erro na consulta SQL: {queryError}</div>}
      {notice && <div className="toast" aria-hidden="true">{notice}</div>}
    </main>
  );
}

