import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  async redirects() {
    return [
      { source: "/pricing", destination: "https://www.digimark101.com/pricing", permanent: false },
      { source: "/prompts", destination: "https://www.digimark101.com/ava", permanent: false },
      { source: "/upgrade", destination: "https://www.digimark101.com/pricing", permanent: false },
      { source: "/account", destination: "https://www.digimark101.com/account", permanent: false },
      { source: "/studio", destination: "/crm", permanent: false },
      { source: "/office", destination: "/", permanent: false },
    ]
  },
};

export default nextConfig;
