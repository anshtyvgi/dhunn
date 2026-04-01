import type { NextConfig } from "next";

const R2_PUBLIC_HOSTNAME = process.env.R2_PUBLIC_HOSTNAME ?? "pub-8dbb25dae1cc41a9b7ac5080930785f3.r2.dev";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: R2_PUBLIC_HOSTNAME,
      },
    ],
  },
};

export default nextConfig;
