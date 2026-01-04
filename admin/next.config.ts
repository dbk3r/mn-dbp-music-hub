import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/dbp-admin",
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
  // Increase body size limit for rewrites/middleware
  bodySizeLimit: "100mb",
  clientMaxBodySize: "100mb",
  async rewrites() {
    // Use internal URL for server-side requests (Docker network)
    // Falls back to external URL if internal is not set
    const backend = (
      process.env.MEDUSA_BACKEND_INTERNAL_URL || 
      process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 
      "http://localhost:9000"
    ).replace(/\/$/, "")

    return [
      {
        source: "/custom/:path*",
        destination: `${backend}/custom/:path*`,
      },
      {
        source: "/admin/:path*",
        destination: `${backend}/custom/admin/:path*`,
      },
    ]
  },
};

export default nextConfig;
