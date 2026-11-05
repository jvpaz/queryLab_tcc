import { memo, useEffect, useRef, useState } from "react";
import { KeyRound, Table2, Link } from "lucide-react";
import { Connection, Handle, Position, useEdges, useReactFlow, type Node, type NodeProps } from "@xyflow/react";
import type { TableDefinition } from "@/types/database";
import { handleEdgeConnection } from "./handleEdgeConnection";
import { NodeMouseHandler } from "@xyflow/react";
import { handleTableNameChange } from "./handleTableNameChange";

export type TableNodeData = TableDefinition & { selected?: boolean };
export type TableFlowNode = Node<TableNodeData, "table">;

function TableNode({ id, data, selected }: NodeProps<TableFlowNode>) {
  const { updateNodeData } = useReactFlow<TableFlowNode>();
  const [editingNode, setEditingNode] = useState(false);
  const [name, setName] = useState(data.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const edges = useEdges();

  // mantém o input sincronizado se o nome mudar por fora
  //TODO Passar isso tudo para um hook customizado, para não poluir o componente
  useEffect(() => {
    if (!editingNode) setName(data.name);
  }, [data.name, editingNode]);

  useEffect(() => {
    if (editingNode) inputRef.current?.select();
  }, [editingNode]);

  const save = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== data.name) {
      updateNodeData(id, { name: trimmed });
      handleTableNameChange(data.name, trimmed).catch((err) => {
        console.error("Error renaming table:", err);
        setName(data.name); // revert to old name on error
      });
    } else {
      setName(data.name);
    }
    setEditingNode(false);
  };

  const cancel = () => {
    setName(data.name);
    setEditingNode(false);
  };

  return (
    <div
      className="table-node"
      style={selected ? { borderColor: "var(--accent)" } : undefined}
    >
      <div className="table-heading" onDoubleClick={() => setEditingNode(true)}>
        <span className="table-name">
          <Table2 size={14} className="table-icon" />
          {editingNode ? (
            <input
              ref={inputRef}
              className="table-name"
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              onBlur={save}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") cancel();
              }}
            />
          ) : (
            data.name
          )}
        </span>
        <span className="table-count">{data.rowCount ?? 0} rows</span>
      </div>
      {data.columns.map((column) => {

          //TODO - Gambiarra, ver uma forma de arrumar isso depois

          const handleIdRight = data.name + "." + column.name + "-right";
           const isForeignKey =
    column.foreignKey || edges.some((edge) => edge.sourceHandle === handleIdRight);

        return (

        

        <div className="column" key={column.name}>
          <Handle
        type="target"
        position={Position.Left}
        style={{ background: "#78a9ff", border: 0, width: 7, height: 7, position: "absolute" }}
        id={data.name + "." + column.name + "-left"}
      />
          
          <span className="column-left">
            
              {column.primaryKey ? 
                <span className="column-key">
              <KeyRound size={10} /> 
                </span>
              : ""} 
                
              {isForeignKey ? 
                <span className="column-foreign">
              <Link size={10} /> 
                </span>
              : ""}
            
            {column.name}
          </span>
          <span className="column-type">{column.type}</span>
          <Handle
        type="source"
        position={Position.Right}
        style={{ background: "#78a9ff", border: 0, width: 7, height: 7, position: "absolute" }}
        id={data.name + "." + column.name + "-right"}
      />
        </div>
        
      )}  )}
      <div className="table-footer">{data.columns.length} colunas</div>
        {/* <Handle
          type="source"
          position={Position.Right}
          style={{ background: "#78a9ff", border: 0, width: 7, height: 7 }}
        /> */}
    </div>
  );
}

export default memo(TableNode);
