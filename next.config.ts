import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a minimal self-contained server bundle for Docker / Cloud Run.
  // Produces .next/standalone with only the deps the server actually needs.
  output: "standalone",
};

export default nextConfig;
