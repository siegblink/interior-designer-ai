import { list } from "@vercel/blob";

export const DESIGNS_PREFIX = "designs/";

// Blob's list() returns at most 1000 entries per call. The cap only bounds the
// loop if the API ever kept returning a cursor.
const MAX_LIST_PAGES = 100;

export interface Design {
  url: string;
  theme: string;
  room: string;
  /** ISO 8601 upload time. */
  createdAt: string;
}

/** Blob pathname for a new design: `designs/<timestamp>_<theme>_<room>.png`. */
export function encodeDesignPathname(theme: string, room: string): string {
  return `${DESIGNS_PREFIX}${Date.now()}_${encodeURIComponent(theme)}_${encodeURIComponent(room)}.png`;
}

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    // Not something encodeDesignPathname produced; show it as stored.
    return segment;
  }
}

/** Reads the theme and room back out of a pathname made by encodeDesignPathname. */
export function decodeDesignPathname(pathname: string): {
  theme: string;
  room: string;
} {
  const filename = pathname.split("/").pop() ?? "";
  const withoutExt = filename.replace(/\.png$/, "");
  const [, encodedTheme, ...rest] = withoutExt.split("_");
  return {
    theme: decodeSegment(encodedTheme ?? ""),
    room: decodeSegment(rest.join("_")),
  };
}

/** Every saved design, newest first. */
export async function listDesigns(): Promise<Design[]> {
  const designs: Design[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < MAX_LIST_PAGES; page++) {
    const result = await list({ prefix: DESIGNS_PREFIX, cursor });
    for (const blob of result.blobs) {
      designs.push({
        url: blob.url,
        ...decodeDesignPathname(blob.pathname),
        createdAt: blob.uploadedAt.toISOString(),
      });
    }
    cursor = result.hasMore ? result.cursor : undefined;
    if (!cursor) break;
  }

  return designs.sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );
}
