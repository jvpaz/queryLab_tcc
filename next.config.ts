import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sql.js loads its WebAssembly binary from /sql-wasm.wasm in the browser.
  turbopack: {},
};

export default nextConfig;
