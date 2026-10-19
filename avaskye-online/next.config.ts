import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  async redirects() {
    return [
      { source: "/pricing", destination: "/", permanent: false },
      { source: "/billing", destination: "/campaigns", permanent: false },
      { source: "/studio", destination: "/crm", permanent: false },
      { source: "/office", destination: "/", permanent: false },
    ]
  },
};

export default nextConfig;
