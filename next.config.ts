import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lean, self-contained production server for Docker (.next/standalone).
  output: "standalone",
};

export default nextConfig;
