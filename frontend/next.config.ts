import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backend = (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(
      /\/$/,
      ""
    )

    return [
      {
        source: "/custom/:path*",
        destination: `${backend}/custom/:path*`,
      },
    ]
  },
};

export default nextConfig;
