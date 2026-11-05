import { executeBatch } from "@/lib/db/engine";

export async function handleTableNameChange(oldName: string, newName: string): Promise<void> {
  await executeBatch(`ALTER TABLE "${oldName}" RENAME TO "${newName}";`);
}