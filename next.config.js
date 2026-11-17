/**
 * Hostname of this project's public Blob store, so the image optimizer does
 * not serve images from other people's stores. The store id is the fourth
 * segment of the read-write token (@vercel/blob derives it the same way).
 * Without a token, e.g. a build that has no Blob store, any public store
 * matches.
 */
function blobStoreHostname() {
  const storeId = process.env.BLOB_READ_WRITE_TOKEN?.split("_")[3];
  const subdomain = storeId ? storeId.toLowerCase() : "*";
  return `${subdomain}.public.blob.vercel-storage.com`;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Next 16.3+ otherwise creates (and re-creates) an AGENTS.md at the repo
  // root whenever a coding agent runs `next dev`. CLAUDE.md is this repo's
  // agent guide and points at the bundled Next.js docs itself.
  agentRules: false,
  images: {
    remotePatterns: [
      {
        // Saved gallery designs. Every design is stored under designs/. The
        // empty search keeps one image from being optimized again and again
        // under different query strings.
        protocol: "https",
        hostname: blobStoreHostname(),
        pathname: "/designs/**",
        search: "",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // The app is never meant to be embedded; this blocks clickjacking.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
