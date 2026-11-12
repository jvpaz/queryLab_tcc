import { useReactFlow } from "@xyflow/react";
import { useState, useRef, useEffect } from "react";
import { TableFlowNode } from "../components/TableNode";
import { handleTableNameChange } from "../utils/handleTableNameChange";

export function useEditableName(id: string, currentName: string) {
  const { updateNodeData } = useReactFlow<TableFlowNode>();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setName(currentName);
  }, [currentName, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  //TODO - Lidar com a renomeação de uma tabela, no momento isso está gerando bastante bugs

  const save = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== currentName) {
      updateNodeData(id, { id: trimmed, name: trimmed });
      console.log(id, trimmed);
      handleTableNameChange(currentName, trimmed).catch((err) => {
        console.error("Erro renomeando tabela:", err);
        updateNodeData(id, { name: currentName }); 

      });
    } else {
      setName(currentName);
    }
    setEditing(false);
  };

  const cancel = () => {
    setName(currentName);
    setEditing(false);
  };

  return { editing, setEditing, name, setName, inputRef, save, cancel };
}