/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next 16.3 appends a `nextjs-agent-rules` block to CLAUDE.md on every
  // `next dev`. This file is hand-authored, so opt out of that.
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
