import { memo } from "react";
import { KeyRound, Table2, Link } from "lucide-react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { TableDefinition } from "@/types/database";

export type TableNodeData = TableDefinition & { selected?: boolean };
export type TableFlowNode = Node<TableNodeData, "table">;

function TableNode({ data, selected }: NodeProps<TableFlowNode>) {
  return (
    <div
      className="table-node"
      style={selected ? { borderColor: "var(--accent)" } : undefined}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "#78a9ff", border: 0, width: 7, height: 7 }}
      />
      <div className="table-heading">
        <span className="table-name">
          <Table2 size={14} className="table-icon" />
          {data.name}
        </span>
        <span className="table-count">{data.rowCount ?? 0} rows</span>
      </div>
      {data.columns.map((column) => (
        <div className="column" key={column.name}>
          <span className="column-left">
            
              {column.primaryKey ? 
                <span className="column-key">
              <KeyRound size={10} /> 
                </span>
              : ""} 
                
              {column.foreignKey ? 
                <span className="column-foreign">
              <Link size={10} /> 
                </span>
              : ""}
            
            {column.name}
          </span>
          <span className="column-type">{column.type}</span>
        </div>
      ))}
      <div className="table-footer">{data.columns.length} colunas</div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "#78a9ff", border: 0, width: 7, height: 7 }}
      />
    </div>
  );
}

export default memo(TableNode);
