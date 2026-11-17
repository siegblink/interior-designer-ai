import { list } from "@vercel/blob";
import { revalidateTag, unstable_cache } from "next/cache";

export const DESIGNS_PREFIX = "designs/";

const DESIGNS_CACHE_TAG = "designs";
const DESIGNS_CACHE_SECONDS = 6 * 60 * 60;

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

// The listing in flight, if any. Next.js bundles pages and route handlers
// separately, so each gets its own copy of this module; the state lives on
// globalThis so that a save or delete (a route handler) can make the /gallery
// page forget a listing that started before it.
const LISTING_STATE = Symbol.for("interior-designer.designs-listing");
const listingState = ((globalThis as Record<symbol, unknown>)[LISTING_STATE] ??=
  { pending: null }) as { pending: Promise<Design[]> | null };

/**
 * One listDesigns() at a time in this process. unstable_cache does not merge
 * concurrent misses, so without this every request that arrives while the
 * cache is empty would list the store itself.
 */
function listDesignsOnce(): Promise<Design[]> {
  if (!listingState.pending) {
    const listing = listDesigns().finally(() => {
      if (listingState.pending === listing) listingState.pending = null;
    });
    listingState.pending = listing;
  }
  return listingState.pending;
}

/**
 * listDesigns() for pages anyone can request. Every Blob list() call is a
 * metered operation (Vercel's Hobby plan includes 2,000 a month and then
 * blocks the store), so public requests must not each trigger one. The result
 * is reused until a design is saved or deleted (revalidateDesigns()) and
 * refreshed every 6 hours. A failed listing is not cached.
 *
 * Keep the periodic refresh. It picks up changes made outside the app, and it
 * repairs the rare case where a listing that started before a save finishes
 * after it and is cached without the new design. Next.js does not cache
 * entries over 2 MB, which is roughly 10,000 designs.
 */
export const listDesignsCached = unstable_cache(listDesignsOnce, ["designs"], {
  tags: [DESIGNS_CACHE_TAG],
  revalidate: DESIGNS_CACHE_SECONDS,
});

/** Drops the cached listing. Call after saving or deleting a design. */
export function revalidateDesigns(): void {
  // A listing still in flight predates this change; later callers must not
  // be handed it. (This reaches the page only when it runs in this process.)
  listingState.pending = null;
  // expire: 0 makes the next listing wait for fresh data instead of showing
  // the old list once more, so a design appears right after it is saved.
  revalidateTag(DESIGNS_CACHE_TAG, { expire: 0 });
}
