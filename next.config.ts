import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client'],
  trailingSlash: false,
  generateBuildId: async () => {
    return 'build-' + Date.now()
  }
};

export default nextConfig;
