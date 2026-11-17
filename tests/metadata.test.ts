import "./setup";
import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import manifest from "../app/manifest";
import robots from "../app/robots";
import sitemap from "../app/sitemap";

const SITE_URL = "https://interior-designer-ai.vercel.app";
const PUBLIC_DIR = join(import.meta.dir, "..", "public");

describe("web manifest", () => {
  test("every icon it lists exists in public/", () => {
    const icons = manifest().icons ?? [];
    expect(icons.length).toBeGreaterThan(0);
    for (const icon of icons) {
      expect({
        src: icon.src,
        exists: existsSync(join(PUBLIC_DIR, icon.src)),
      }).toEqual({ src: icon.src, exists: true });
    }
  });

  test("has the 192px and 512px icons an installable app needs", () => {
    const sizes = (manifest().icons ?? []).map((icon) => icon.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
  });
});

describe("robots.txt and sitemap.xml", () => {
  test("robots.txt allows crawling and points at the sitemap", () => {
    const { rules, sitemap: sitemapUrl } = robots();
    expect(rules).toEqual({ userAgent: "*", allow: "/" });
    expect(sitemapUrl).toBe(`${SITE_URL}/sitemap.xml`);
  });

  test("the sitemap lists the home page", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toEqual([SITE_URL]);
  });
});
