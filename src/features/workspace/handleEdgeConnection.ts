import { getDatabase } from "@/lib/db/engine";
import { useWorkspaceStore } from "@/store/workspace";
import { Connection } from "@xyflow/react";

const COLUMN_REGEX = /^[^.]+\.(.+)-(?:left|right)$/;

function getColumnName(handle: string): string | null {
  return handle.match(COLUMN_REGEX)?.[1] ?? null;
}

export async function handleEdgeConnection(params: Connection): Promise<boolean> {


  const { source, sourceHandle, target, targetHandle } = params;
  if (!source || !sourceHandle || !target || !targetHandle) {
    useWorkspaceStore.getState().setQueryError("Conexão de parametros inválida");
    throw new Error("Conexão de parametros inválida");
  }

  const sourceColumn = getColumnName(sourceHandle);
  const targetColumn = getColumnName(targetHandle);

  if (!sourceColumn || !targetColumn) {
    throw new Error("Coluna inválida");
  }

  console.log(params);

  const db = await getDatabase();
    const quote = (identifier: string) => `"${identifier.replaceAll('"', '""')}"`;
  try {
      await db.exec(
        `ALTER TABLE ${quote(source)} ADD FOREIGN KEY (${quote(sourceColumn)}) REFERENCES ${quote(target)} (${quote(targetColumn)});`,
      )
      return true;
    }
  catch (error) {
    useWorkspaceStore.getState().setQueryError("Erro ao criar a chave estrangeira, verifique se a coluna de origem e destino possuem o mesmo tipo de dado e são Nullables");
    return false;
  }
   
}