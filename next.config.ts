import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
