import { executeBatch } from "@/lib/db/engine";
import { useWorkspaceStore } from "@/store/workspace";

export async function handleTableNameChange(oldName: string, newName: string): Promise<void> {
  await executeBatch(`ALTER TABLE ${oldName} RENAME TO ${newName};`);

  useWorkspaceStore.getState().updateTableName(oldName, newName);

}