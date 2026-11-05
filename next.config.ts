import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      module: { browser: "./src/lib/empty-module.ts" },
    },
  },
  serverExternalPackages: ["@electric-sql/pglite", "@electric-sql/pglite-tools"],
  
};

export default nextConfig;
