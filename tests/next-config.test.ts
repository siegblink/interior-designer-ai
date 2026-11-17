import "./setup";
import { describe, expect, test } from "bun:test";
import { createRequire } from "node:module";
import type { NextConfig } from "next";
import nextConfig from "../next.config.js";

const require = createRequire(import.meta.url);

/** Loads next.config.js afresh, as a build with this Blob token would. */
function loadConfigWithBlobToken(token: string | undefined): NextConfig {
  if (token === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
  else process.env.BLOB_READ_WRITE_TOKEN = token;
  const path = require.resolve("../next.config.js");
  const previous = require.cache[path];
  delete require.cache[path];
  try {
    return require(path) as NextConfig;
  } finally {
    // Put back the module the static import resolved to, or a rerun of this
    // file would import whichever copy was loaded last.
    if (previous) require.cache[path] = previous;
    else delete require.cache[path];
  }
}

function blobPattern(config: NextConfig) {
  return config.images?.remotePatterns?.[0];
}

describe("next.config.js", () => {
  test("sends the security headers on every path", async () => {
    if (!nextConfig.headers) throw new Error("expected a headers() function");
    const rules = await nextConfig.headers();
    const everyPath = rules.find((rule) => rule.source === "/:path*");
    if (!everyPath) throw new Error("expected a rule for every path");

    const headers = Object.fromEntries(
      everyPath.headers.map((header) => [
        header.key.toLowerCase(),
        header.value,
      ])
    );
    expect(headers).toMatchObject({
      "x-frame-options": "DENY",
      "content-security-policy": "frame-ancestors 'none'",
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
    });
  });

  test("does not advertise the framework", () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });

  test("pins the Blob image host to the store in BLOB_READ_WRITE_TOKEN", () => {
    const config = loadConfigWithBlobToken(
      "vercel_blob_rw_AbC123xYz_0123456789abcdefghijklmnopqrstuv"
    );

    expect(blobPattern(config)).toEqual({
      protocol: "https",
      hostname: "abc123xyz.public.blob.vercel-storage.com",
      pathname: "/designs/**",
      search: "",
    });
  });

  test("falls back to any public Blob store when no usable token is set", () => {
    for (const token of [undefined, "", "not-a-blob-token", "a_b_c_"]) {
      expect(blobPattern(loadConfigWithBlobToken(token))?.hostname).toBe(
        "*.public.blob.vercel-storage.com"
      );
    }
  });

  test("only optimizes saved designs, and never with a query string", () => {
    // Every distinct source URL is a separate, metered image transformation.
    expect(nextConfig.images?.remotePatterns).toEqual([
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/designs/**",
        search: "",
      },
    ]);
  });

  test("leaves the image optimizer's SVG handling off", () => {
    expect(nextConfig.images?.dangerouslyAllowSVG).not.toBe(true);
  });

  test("stops next dev from generating an AGENTS.md", () => {
    expect(nextConfig.agentRules).toBe(false);
  });

  test("applies the security headers without conditions", async () => {
    if (!nextConfig.headers) throw new Error("expected a headers() function");
    const rules = await nextConfig.headers();
    const everyPath = rules.find((rule) => rule.source === "/:path*");
    if (!everyPath) throw new Error("expected a rule for every path");

    expect(everyPath.has).toBeUndefined();
    expect(everyPath.missing).toBeUndefined();
  });
});
