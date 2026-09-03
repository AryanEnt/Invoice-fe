import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "10.110.110.77",
    "10.*",
  ],
};

export default nextConfig;
