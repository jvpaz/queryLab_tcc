import { executeBatch, getDatabase } from "@/lib/db/engine";
import { Connection } from "@xyflow/react";

const COLUMN_REGEX = /^[^.]+\.(.+)-(?:left|right)$/;

function getColumnName(handle: string): string | null {
  return handle.match(COLUMN_REGEX)?.[1] ?? null;
}

export async function handleEdgeConnection(params: Connection): Promise<void> {
  const { source, sourceHandle, target, targetHandle } = params;
  if (!source || !sourceHandle || !target || !targetHandle) {
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
    await db.exec(
      `ALTER TABLE ${quote(source)} ADD FOREIGN KEY (${quote(sourceColumn)}) REFERENCES ${quote(target)} (${quote(targetColumn)});`,
    );
}