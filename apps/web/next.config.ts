import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@docuvocab/shared"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;