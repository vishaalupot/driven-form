// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ✅ Ignore ESLint errors during Netlify build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ✅ Ignore TypeScript build errors (optional, if needed)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
