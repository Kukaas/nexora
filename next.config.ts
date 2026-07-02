import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Proofs, document media, and resident ID photos use Server Actions. Keep
      // this just above the largest accepted file (10 MB) plus multipart overhead.
      bodySizeLimit: "11mb",
    },
  },
};

export default nextConfig;
