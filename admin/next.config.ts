// Use a loose type to avoid strict NextConfig type issues during CI builds
// (some experimental/api options are intentionally non-standard here)
const nextConfig: any = {
  basePath: "/dbp-admin",
  experimental: {
    serverActions: true,
  },
  // Increase body size limit for API routes
  api: {
    bodyParser: {
      sizeLimit: "100mb",
    },
  },
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
