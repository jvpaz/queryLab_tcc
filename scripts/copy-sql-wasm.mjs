import { copyFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const sqlEntry = require.resolve("sql.js");
const wasmSource = join(dirname(sqlEntry), "sql-wasm.wasm");
const publicDirectory = join(process.cwd(), "public");

await mkdir(publicDirectory, { recursive: true });
await copyFile(wasmSource, join(publicDirectory, "sql-wasm.wasm"));
console.log("sql.js WebAssembly copied to public/sql-wasm.wasm");
