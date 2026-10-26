import type { NextConfig } from "next";
import path from "path";

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: path.join(__dirname),
  },
  async rewrites() {
    return [
      {
        source: "/v1/:path*",
        destination: `${API_URL}/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
