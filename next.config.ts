import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      // Proofs, document media, and resident ID photos use Server Actions. Keep
      // this just above the largest accepted file (10 MB) plus multipart overhead.
      bodySizeLimit: "11mb",
    },
    // Cache page segments in the client Router Cache so switching between tabs
    // reuses the already-rendered page instead of re-running the server component
    // (and re-hitting the database) every time — which is also what made the
    // route skeleton flash on each navigation. `dynamic: 0` (the default) never
    // caches; 30s covers rapid tab switching while staying fresh. Realtime still
    // wins: socket invalidations refetch React Query, and router.refresh() busts
    // this cache for the current route on the spot.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
