/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next 16.3+ otherwise creates (and re-creates) an AGENTS.md at the repo
  // root whenever a coding agent runs `next dev`. CLAUDE.md is this repo's
  // agent guide and points at the bundled Next.js docs itself.
  agentRules: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "replicate.delivery",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

module.exports = nextConfig;
