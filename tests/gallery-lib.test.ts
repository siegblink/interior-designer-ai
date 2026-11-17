import { BLOB_ORIGIN, blob, nextCache, type ListedBlob } from "./setup";
import { describe, expect, setSystemTime, test } from "bun:test";
import { DESIGN_THEMES, ROOM_TYPES } from "@/lib/constants";

const {
  DESIGNS_PREFIX,
  decodeDesignPathname,
  encodeDesignPathname,
  listDesigns,
  listDesignsCached,
  revalidateDesigns,
} = await import("@/lib/gallery");

function stored(pathname: string, uploadedAt: string): ListedBlob {
  return {
    pathname,
    url: `${BLOB_ORIGIN}/${pathname}`,
    uploadedAt: new Date(uploadedAt),
  };
}

describe("encodeDesignPathname", () => {
  test("builds designs/<timestamp>_<theme>_<room>.png", () => {
    setSystemTime(new Date("2026-11-17T00:00:00Z"));

    expect(encodeDesignPathname("Modern", "Bedroom")).toBe(
      `designs/${Date.parse("2026-11-17T00:00:00Z")}_Modern_Bedroom.png`
    );
    expect(encodeDesignPathname("Mid-Century Modern", "Living Room")).toBe(
      `designs/${Date.now()}_Mid-Century%20Modern_Living%20Room.png`
    );
  });

  test("always stores under the designs/ prefix the gallery lists", () => {
    expect(DESIGNS_PREFIX).toBe("designs/");
    expect(
      encodeDesignPathname("Coastal", "Kitchen").startsWith(DESIGNS_PREFIX)
    ).toBe(true);
  });
});

describe("decodeDesignPathname", () => {
  test("reads back every theme and room it encoded", () => {
    for (const theme of DESIGN_THEMES) {
      for (const room of ROOM_TYPES) {
        expect(decodeDesignPathname(encodeDesignPathname(theme, room))).toEqual(
          { theme, room }
        );
      }
    }
  });

  test("keeps underscores that belong to the room", () => {
    expect(
      decodeDesignPathname("designs/1700000000000_Modern_Rec_Room.png")
    ).toEqual({ theme: "Modern", room: "Rec_Room" });
  });

  test("returns empty strings for names without a theme or room", () => {
    expect(decodeDesignPathname("designs/1700000000000.png")).toEqual({
      theme: "",
      room: "",
    });
    expect(decodeDesignPathname("designs/1700000000000_Modern.png")).toEqual({
      theme: "Modern",
      room: "",
    });
    expect(decodeDesignPathname("")).toEqual({ theme: "", room: "" });
  });

  test("shows a name with a broken percent escape as stored instead of throwing", () => {
    expect(
      decodeDesignPathname("designs/1700000000000_100%_Living%20Room.png")
    ).toEqual({ theme: "100%", room: "Living Room" });
  });
});

describe("listDesigns", () => {
  test("returns designs newest first with ISO upload times", async () => {
    blob.listed = [
      stored("designs/1_Modern_Bedroom.png", "2026-01-01T00:00:00Z"),
      stored("designs/3_Coastal_Kitchen.png", "2026-03-01T00:00:00Z"),
      stored("designs/2_Bohemian_Bathroom.png", "2026-02-01T00:00:00Z"),
    ];

    expect(await listDesigns()).toEqual([
      {
        url: `${BLOB_ORIGIN}/designs/3_Coastal_Kitchen.png`,
        theme: "Coastal",
        room: "Kitchen",
        createdAt: "2026-03-01T00:00:00.000Z",
      },
      {
        url: `${BLOB_ORIGIN}/designs/2_Bohemian_Bathroom.png`,
        theme: "Bohemian",
        room: "Bathroom",
        createdAt: "2026-02-01T00:00:00.000Z",
      },
      {
        url: `${BLOB_ORIGIN}/designs/1_Modern_Bedroom.png`,
        theme: "Modern",
        room: "Bedroom",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
  });

  test("only lists blobs under designs/", async () => {
    await listDesigns();
    expect(blob.listCalls).toHaveLength(1);
    expect(blob.listCalls[0].prefix).toBe("designs/");
    expect(blob.listCalls[0].cursor).toBeUndefined();
  });

  test("follows pagination so designs past the first page are not lost", async () => {
    blob.pageSize = 2;
    blob.listed = [1, 2, 3, 4, 5].map((day) =>
      stored(`designs/${day}_Modern_Bedroom.png`, `2026-01-0${day}T00:00:00Z`)
    );

    const designs = await listDesigns();

    expect(designs).toHaveLength(5);
    expect(designs.map((design) => design.createdAt.slice(8, 10))).toEqual([
      "05",
      "04",
      "03",
      "02",
      "01",
    ]);
    expect(blob.listCalls.map((call) => call.cursor)).toEqual([
      undefined,
      "2",
      "4",
    ]);
  });

  test("returns an empty list when nothing is saved", async () => {
    expect(await listDesigns()).toEqual([]);
  });

  test("lets Blob errors reach the caller", async () => {
    blob.error = new Error("Vercel Blob: store unavailable");
    await expect(listDesigns()).rejects.toThrow(
      "Vercel Blob: store unavailable"
    );
  });

  test("stops after 100 pages if the API never stops returning a cursor", async () => {
    blob.pageSize = 1;
    blob.listed = Array.from({ length: 150 }, (_, index) =>
      stored(`designs/${index}_Modern_Bedroom.png`, "2026-01-01T00:00:00Z")
    );

    const designs = await listDesigns();

    expect(designs).toHaveLength(100);
    expect(blob.listCalls).toHaveLength(100);
  });
});

describe("listDesignsCached", () => {
  test("lists the store once however often it is called", async () => {
    blob.listed = [
      stored("designs/1_Modern_Bedroom.png", "2026-01-01T00:00:00Z"),
    ];

    const first = await listDesignsCached();
    const second = await listDesignsCached();
    const third = await listDesignsCached();

    expect(first).toHaveLength(1);
    expect(second).toEqual(first);
    expect(third).toEqual(first);
    expect(blob.listCalls).toHaveLength(1);
  });

  test("lists again after revalidateDesigns()", async () => {
    blob.listed = [
      stored("designs/1_Modern_Bedroom.png", "2026-01-01T00:00:00Z"),
    ];
    expect(await listDesignsCached()).toHaveLength(1);

    blob.listed = [
      ...blob.listed,
      stored("designs/2_Coastal_Kitchen.png", "2026-01-02T00:00:00Z"),
    ];
    expect(await listDesignsCached()).toHaveLength(1);

    revalidateDesigns();

    expect(await listDesignsCached()).toHaveLength(2);
    expect(blob.listCalls).toHaveLength(2);
  });

  test("invalidates immediately, without serving the old list once more", () => {
    revalidateDesigns();
    expect(nextCache.revalidations).toEqual([
      { tag: "designs", profile: { expire: 0 } },
    ]);
  });

  test("does not cache a failed listing", async () => {
    blob.error = new Error("Vercel Blob: store unavailable");
    await expect(listDesignsCached()).rejects.toThrow("store unavailable");

    blob.error = null;
    blob.listed = [
      stored("designs/1_Modern_Bedroom.png", "2026-01-01T00:00:00Z"),
    ];
    expect(await listDesignsCached()).toHaveLength(1);
  });

  test("listDesigns() itself always asks the store", async () => {
    await listDesigns();
    await listDesigns();
    expect(blob.listCalls).toHaveLength(2);
  });
});

describe("listDesignsCached under load", () => {
  test("concurrent requests on an empty cache share one Blob list()", async () => {
    blob.listed = [
      stored("designs/1_Modern_Bedroom.png", "2026-01-01T00:00:00Z"),
    ];

    const results = await Promise.all(
      Array.from({ length: 50 }, () => listDesignsCached())
    );

    expect(results.every((designs) => designs.length === 1)).toBe(true);
    expect(blob.listCalls).toHaveLength(1);
  });

  test("a listing that began before a save is not handed to callers after it", async () => {
    const before = listDesignsCached();
    revalidateDesigns();
    const after = listDesignsCached();
    await Promise.all([before, after]);

    expect(blob.listCalls).toHaveLength(2);
  });

  test("lists again once a failed listing has settled", async () => {
    blob.error = new Error("Vercel Blob: store unavailable");
    const failures = await Promise.allSettled([
      listDesignsCached(),
      listDesignsCached(),
    ]);
    expect(failures.map((result) => result.status)).toEqual([
      "rejected",
      "rejected",
    ]);

    blob.error = null;
    expect(await listDesignsCached()).toEqual([]);
  });

  test("refreshes the listing every 6 hours", async () => {
    const start = new Date("2026-11-17T00:00:00Z").getTime();
    setSystemTime(new Date(start));
    await listDesignsCached();

    setSystemTime(new Date(start + 6 * 3_600_000 - 1000));
    await listDesignsCached();
    expect(blob.listCalls).toHaveLength(1);

    setSystemTime(new Date(start + 6 * 3_600_000 + 1000));
    await listDesignsCached();
    expect(blob.listCalls).toHaveLength(2);
  });
});

describe("the listing in flight", () => {
  function hold() {
    let release = () => {};
    blob.listHold = new Promise<void>((resolve) => {
      release = resolve;
    });
    return release;
  }

  test("an older listing that settles does not clear a newer one", async () => {
    const releaseFirst = hold();
    const first = listDesignsCached();
    revalidateDesigns();
    const releaseSecond = hold();
    const second = listDesignsCached();

    releaseFirst();
    await first;
    // The second listing is still in flight, so this request must join it.
    const third = listDesignsCached();
    releaseSecond();
    await Promise.all([second, third]);

    expect(blob.listCalls).toHaveLength(2);
  });

  test("is shared by the separate copies of the module a build makes", async () => {
    // Next.js bundles pages and route handlers separately. A save or delete
    // (route copy) must still make the page copy forget its listing.
    type Gallery = typeof import("@/lib/gallery");
    const page = (await import("../lib/gallery.ts?page" as string)) as Gallery;
    const route = (await import(
      "../lib/gallery.ts?route" as string
    )) as Gallery;
    expect(page.listDesignsCached).not.toBe(route.listDesignsCached);

    const before = page.listDesignsCached();
    route.revalidateDesigns();
    const after = page.listDesignsCached();
    await Promise.all([before, after]);

    expect(blob.listCalls).toHaveLength(2);
  });
});
