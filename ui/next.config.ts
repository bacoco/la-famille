import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: "/la-famille",
  env: {
    NEXT_PUBLIC_BASE_PATH: "/la-famille",
  },
};

export default nextConfig;
