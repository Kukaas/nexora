import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Proof screenshots are uploaded through Server Actions; the default body
      // limit is 1 MB, so raise it above our 3 MB proof cap (plus form fields
      // and multipart overhead). See lib/document-actions.ts (MAX_PROOF_BYTES).
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
