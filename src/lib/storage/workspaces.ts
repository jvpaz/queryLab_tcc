import { openDB } from "idb";
import type { DBSchema } from "idb";
import type { WorkspaceSnapshot } from "@/types/database";

interface QueryLabDB extends DBSchema {
  workspaces: { key: string; value: WorkspaceSnapshot; indexes: { "by-updated": number } };
}

const DB_NAME = "querylab-local";
const DB_VERSION = 1;

function getStore() {
  return openDB<QueryLabDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore("workspaces", { keyPath: "id" });
      store.createIndex("by-updated", "updatedAt");
    },
  });
}

export async function saveWorkspace(workspace: WorkspaceSnapshot) {
  const db = await getStore();
  await db.put("workspaces", { ...workspace, updatedAt: Date.now() });
}

export async function listWorkspaces() {
  const db = await getStore();
  return db.getAllFromIndex("workspaces", "by-updated");
}

export async function loadWorkspace(id: string) {
  return (await getStore()).get("workspaces", id);
}

export async function deleteWorkspace(id: string) {
  await (await getStore()).delete("workspaces", id);
}
