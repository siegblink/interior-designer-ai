import {
  ADMIN_SECRET,
  BLOB_ORIGIN,
  blob,
  cookieJar,
  jsonRequest,
  network,
  nextCache,
  rawRequest,
  resetMocks,
} from "./setup";
import { beforeEach, describe, expect, test } from "bun:test";
import { ADMIN_SESSION_COOKIE, createAdminSession } from "@/lib/admin-session";

const galleryRoute = await import("@/app/api/gallery/route");
const { POST, DELETE } = galleryRoute;
const { listDesignsCached } = await import("@/lib/gallery");

const MB = 1024 * 1024;
const SOURCE = "https://replicate.delivery/pbxt/abc/out.png";

const PNG = Buffer.concat([
  Buffer.from("89504e470d0a1a0a", "hex"),
  Buffer.alloc(256, 1),
]);
const JPEG = Buffer.concat([
  Buffer.from("ffd8ffe0", "hex"),
  Buffer.alloc(256, 2),
]);
const WEBP = Buffer.concat([
  Buffer.from("RIFF"),
  Buffer.alloc(4),
  Buffer.from("WEBP"),
  Buffer.alloc(64, 3),
]);
const MP4 = Buffer.concat([
  Buffer.alloc(4),
  Buffer.from("ftypisom"),
  Buffer.alloc(64, 4),
]);
const SVG = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>'
);
const HTML = Buffer.from("<!doctype html><script>alert(1)</script>");

function serve(url: string, body: Buffer, headers?: Record<string, string>) {
  network.routes.set(
    url,
    () => new Response(new Uint8Array(body), { headers })
  );
}

function redirect(from: string, to: string, status = 302) {
  network.routes.set(
    from,
    () => new Response("redirecting", { status, headers: { location: to } })
  );
}

function save(
  imageUrl: unknown = SOURCE,
  theme: unknown = "Modern",
  room: unknown = "Bedroom"
) {
  return POST(jsonRequest("POST", "/api/gallery", { imageUrl, theme, room }));
}

function remove(url: unknown) {
  return DELETE(jsonRequest("DELETE", "/api/gallery", { url }));
}

function signInAsAdmin() {
  const session = createAdminSession();
  if (!session) throw new Error("expected a session");
  cookieJar.set(ADMIN_SESSION_COOKIE, session);
}

function requestedUrls() {
  return network.requests.map((request) => request.url);
}

beforeEach(resetMocks);

describe("POST /api/gallery", () => {
  test("stores a Replicate output in Blob and returns its URL", async () => {
    serve(SOURCE, PNG);

    const response = await save(SOURCE, "Mid-Century Modern", "Living Room");

    expect(response.status).toBe(201);
    expect(blob.puts).toHaveLength(1);
    const [stored] = blob.puts;
    expect(stored.pathname).toMatch(
      /^designs\/\d+_Mid-Century%20Modern_Living%20Room\.png$/
    );
    expect(stored.body.equals(PNG)).toBe(true);
    expect(stored.access).toBe("public");
    expect(stored.contentType).toBe("image/png");
    expect(await response.json()).toEqual({
      url: `${BLOB_ORIGIN}/${stored.pathname}`,
    });
  });

  test("never lets fetch follow redirects on its own", async () => {
    serve(SOURCE, PNG);
    await save();
    expect(network.requests).toEqual([{ url: SOURCE, redirect: "manual" }]);
  });

  test("decides the content type from the bytes, not the upstream header", async () => {
    const cases: [Buffer, string][] = [
      [PNG, "image/png"],
      [JPEG, "image/jpeg"],
      [WEBP, "image/webp"],
    ];
    for (const [bytes, expected] of cases) {
      resetMocks();
      serve(SOURCE, bytes, { "content-type": "text/html" });

      const response = await save();

      expect(response.status).toBe(201);
      expect(blob.puts[0].contentType).toBe(expected);
    }
  });

  test("rejects files that are not PNG, JPEG or WebP, whatever the header says", async () => {
    for (const bytes of [MP4, SVG, HTML, Buffer.alloc(0), PNG.subarray(0, 4)]) {
      resetMocks();
      serve(SOURCE, bytes, { "content-type": "image/png" });

      const response = await save();

      expect(response.status).toBe(400);
      expect(blob.puts).toHaveLength(0);
    }
  });

  test("accepts allowlisted subdomains", async () => {
    const url = "https://pbxt.replicate.delivery/abc/out.png";
    serve(url, PNG);
    expect((await save(url)).status).toBe(201);
  });

  test("rejects URLs outside the allowlist without fetching them", async () => {
    const urls = [
      "https://evil.example/out.png",
      "https://replicate.delivery.evil.example/out.png",
      "https://evilreplicate.delivery/out.png",
      "https://replicate.delivery@evil.example/out.png",
      "http://replicate.delivery/out.png",
      "ftp://replicate.delivery/out.png",
      "data:image/png;base64,iVBORw0KGgo=",
      "//replicate.delivery/out.png",
      "not a url",
      "",
    ];
    for (const url of urls) {
      const response = await save(url);
      expect(response.status).toBe(400);
    }
    expect(network.requests).toHaveLength(0);
    expect(blob.puts).toHaveLength(0);
  });

  test("rejects bodies with an unknown theme or room, or a non-string URL", async () => {
    const bodies = [
      { imageUrl: SOURCE, theme: "<b>spam</b>", room: "Bedroom" },
      { imageUrl: SOURCE, theme: "Modern", room: "Garage" },
      { imageUrl: SOURCE, theme: "modern", room: "Bedroom" },
      { imageUrl: SOURCE, theme: "Modern" },
      { imageUrl: SOURCE, room: "Bedroom" },
      { imageUrl: [SOURCE], theme: "Modern", room: "Bedroom" },
      { imageUrl: null, theme: "Modern", room: "Bedroom" },
      { theme: "Modern", room: "Bedroom" },
      null,
      [],
      "text",
    ];
    for (const body of bodies) {
      const response = await POST(jsonRequest("POST", "/api/gallery", body));
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Invalid request." });
    }
    expect(network.requests).toHaveLength(0);
    expect(blob.puts).toHaveLength(0);
  });

  test("rejects a malformed JSON body", async () => {
    const response = await POST(rawRequest("POST", "/api/gallery", "{nope"));
    expect(response.status).toBe(400);
    expect(network.requests).toHaveLength(0);
  });

  describe("redirects", () => {
    test("follows a redirect to an allowlisted host", async () => {
      const target = "https://pbxt.replicate.delivery/final/out.jpg";
      redirect(SOURCE, target);
      serve(target, JPEG);

      const response = await save();

      expect(response.status).toBe(201);
      expect(blob.puts[0].contentType).toBe("image/jpeg");
      expect(requestedUrls()).toEqual([SOURCE, target]);
    });

    test("resolves relative redirects against the current URL", async () => {
      redirect(SOURCE, "/other/final.webp", 307);
      serve("https://replicate.delivery/other/final.webp", WEBP);

      const response = await save();

      expect(response.status).toBe(201);
      expect(blob.puts[0].contentType).toBe("image/webp");
    });

    test("refuses a redirect to another host and never requests it", async () => {
      const targets = [
        "https://evil.example/out.png",
        "http://169.254.169.254/latest/meta-data/",
        "http://localhost:3000/api/admin/auth",
        "http://replicate.delivery/out.png",
        "//evil.example/out.png",
        "https://replicate.delivery.evil.example/out.png",
      ];
      for (const target of targets) {
        resetMocks();
        redirect(SOURCE, target);
        network.routes.set(target, () => new Response(new Uint8Array(PNG)));

        const response = await save();

        expect(response.status).toBe(400);
        expect(requestedUrls()).toEqual([SOURCE]);
        expect(blob.puts).toHaveLength(0);
      }
    });

    test("refuses a redirect without a Location header", async () => {
      network.routes.set(SOURCE, () => new Response("moved", { status: 302 }));
      expect((await save()).status).toBe(400);
      expect(blob.puts).toHaveLength(0);
    });

    test("follows at most 3 redirects", async () => {
      const hops = [0, 1, 2, 3, 4].map(
        (hop) => `https://replicate.delivery/hop/${hop}`
      );
      redirect(hops[0], hops[1]);
      redirect(hops[1], hops[2]);
      redirect(hops[2], hops[3]);
      serve(hops[3], PNG);
      expect((await save(hops[0])).status).toBe(201);

      resetMocks();
      redirect(hops[0], hops[1]);
      redirect(hops[1], hops[2]);
      redirect(hops[2], hops[3]);
      redirect(hops[3], hops[4]);
      serve(hops[4], PNG);
      expect((await save(hops[0])).status).toBe(400);
      expect(requestedUrls()).toEqual(hops.slice(0, 4));
      expect(blob.puts).toHaveLength(0);
    });

    test("gives up on a redirect loop", async () => {
      redirect(SOURCE, SOURCE);
      expect((await save()).status).toBe(400);
      expect(network.requests).toHaveLength(4);
    });
  });

  describe("size limit", () => {
    test("accepts an image of exactly 10MB", async () => {
      const image = Buffer.concat([PNG, Buffer.alloc(10 * MB - PNG.length, 7)]);
      serve(SOURCE, image);

      const response = await save();

      expect(response.status).toBe(201);
      expect(blob.puts[0].body.length).toBe(10 * MB);
    });

    test("rejects a declared Content-Length over 10MB without reading the body", async () => {
      let chunks = 0;
      network.routes.set(
        SOURCE,
        () =>
          new Response(
            new ReadableStream({
              pull(controller) {
                chunks += 1;
                if (chunks > 64) return controller.close();
                controller.enqueue(new Uint8Array(MB).fill(1));
              },
            }),
            { headers: { "content-length": String(10 * MB + 1) } }
          )
      );

      const response = await save();

      expect(response.status).toBe(400);
      expect(blob.puts).toHaveLength(0);
      // Streams pre-fetch a chunk or two; the point is the body is not drained.
      expect(chunks).toBeLessThan(5);
    });

    test("stops reading a streamed body once it passes 10MB", async () => {
      let chunks = 0;
      network.routes.set(
        SOURCE,
        () =>
          new Response(
            new ReadableStream({
              pull(controller) {
                chunks += 1;
                if (chunks > 64) return controller.close();
                const chunk = new Uint8Array(MB).fill(1);
                if (chunks === 1) chunk.set(PNG.subarray(0, 8));
                controller.enqueue(chunk);
              },
            })
          )
      );

      const response = await save();

      expect(response.status).toBe(400);
      expect(blob.puts).toHaveLength(0);
      expect(chunks).toBeLessThan(20);
      // The short timeout catches an awaited reader.cancel(), which hangs.
    }, 2000);

    test("rejects a streamed body one byte over 10MB", async () => {
      const image = Buffer.concat([
        PNG,
        Buffer.alloc(10 * MB - PNG.length + 1, 7),
      ]);
      serve(SOURCE, image);

      const response = await save();

      expect(response.status).toBe(400);
      expect(blob.puts).toHaveLength(0);
    });
  });

  test("answers promptly when the upstream file is missing", async () => {
    // Guards against awaiting body.cancel() on a tee'd response, which never
    // settles (see the fetch mock in setup.ts) and would hang the request
    // until this test's short timeout.
    network.routes.set(
      SOURCE,
      () => new Response("not found", { status: 404 })
    );

    const response = await save();

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Failed to fetch image from source URL.",
    });
    expect(blob.puts).toHaveLength(0);
  }, 2000);

  test("returns 500 when Blob storage fails", async () => {
    serve(SOURCE, PNG);
    blob.error = new Error("Vercel Blob: store unavailable");

    const response = await save();

    expect(response.status).toBe(500);
    expect((await response.json()).error).toBe(
      "Vercel Blob: store unavailable"
    );
  });

  test("returns 500 when the upstream request itself fails", async () => {
    // No route registered: the fetch mock throws, like a network error.
    const response = await save();
    expect(response.status).toBe(500);
    expect(blob.puts).toHaveLength(0);
  });
});

describe("DELETE /api/gallery", () => {
  const DESIGN_URL = `${BLOB_ORIGIN}/designs/1700000000000_Mid-Century%2520Modern_Living%2520Room.png`;

  test("deletes a design for a signed-in admin", async () => {
    signInAsAdmin();

    const response = await remove(DESIGN_URL);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(blob.deleted).toEqual([DESIGN_URL]);
  });

  test("rejects requests without a valid admin session", async () => {
    const sessions = [
      undefined,
      "",
      ADMIN_SECRET,
      "garbage",
      `${Date.now() + 60_000}.${"0".repeat(64)}`,
    ];
    for (const session of sessions) {
      cookieJar.clear();
      if (session !== undefined) cookieJar.set(ADMIN_SESSION_COOKIE, session);

      const response = await remove(DESIGN_URL);

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "Unauthorized" });
    }
    expect(blob.deleted).toHaveLength(0);
  });

  test("rejects a session issued before the admin secret was rotated", async () => {
    signInAsAdmin();
    process.env.GALLERY_ADMIN_SECRET = "rotated-secret";

    expect((await remove(DESIGN_URL)).status).toBe(401);
    expect(blob.deleted).toHaveLength(0);
  });

  test("checks the session before looking at the body", async () => {
    const response = await DELETE(
      rawRequest("DELETE", "/api/gallery", "{nope")
    );
    expect(response.status).toBe(401);
  });

  test("only deletes design URLs in a public Blob store", async () => {
    signInAsAdmin();
    const urls = [
      "designs/1700000000000_Modern_Bedroom.png",
      `${BLOB_ORIGIN}/other/file.png`,
      `${BLOB_ORIGIN}/designs/../other/file.png`,
      `${BLOB_ORIGIN}/designs/%2e%2e/other/file.png`,
      `${BLOB_ORIGIN}/designs`,
      `${BLOB_ORIGIN.replace("https:", "http:")}/designs/a.png`,
      "https://evil.example/designs/a.png",
      "https://teststore.public.blob.vercel-storage.com.evil.example/designs/a.png",
      "https://evilpublic.blob.vercel-storage.com/designs/a.png",
      "https://public.blob.vercel-storage.com/designs/a.png",
      [DESIGN_URL],
      { url: DESIGN_URL },
      null,
      42,
      "",
    ];
    for (const url of urls) {
      const response = await remove(url);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: "Not a gallery design URL.",
      });
    }
    expect(blob.deleted).toHaveLength(0);
  });

  test("rejects a malformed JSON body from an admin", async () => {
    signInAsAdmin();
    const response = await DELETE(
      rawRequest("DELETE", "/api/gallery", "{nope")
    );
    expect(response.status).toBe(400);
    expect(blob.deleted).toHaveLength(0);
  });

  test("returns 500 when Blob storage fails", async () => {
    signInAsAdmin();
    blob.error = new Error("Vercel Blob: store unavailable");

    const response = await remove(DESIGN_URL);

    expect(response.status).toBe(500);
    expect((await response.json()).error).toBe(
      "Vercel Blob: store unavailable"
    );
  });
});

describe("POST /api/gallery: signatures, boundaries and messages", () => {
  test("rejects files that only partly match an image signature", async () => {
    const nearMisses = [
      // PNG: right first 4 bytes, wrong remainder of the 8-byte signature
      Buffer.concat([
        Buffer.from("89504e4700000000", "hex"),
        Buffer.alloc(64, 1),
      ]),
      // JPEG: FF D8 not followed by a marker byte
      Buffer.concat([Buffer.from("ffd800", "hex"), Buffer.alloc(64, 2)]),
      // JPEG: D8 FF without the leading FF
      Buffer.concat([Buffer.from("00d8ff", "hex"), Buffer.alloc(64, 2)]),
      // A RIFF container that is not WebP (WAV audio)
      Buffer.concat([
        Buffer.from("RIFF"),
        Buffer.alloc(4),
        Buffer.from("WAVE"),
        Buffer.alloc(64, 3),
      ]),
      // "WEBP" at offset 8 without the RIFF header
      Buffer.concat([
        Buffer.from("RIFX"),
        Buffer.alloc(4),
        Buffer.from("WEBP"),
        Buffer.alloc(64, 3),
      ]),
    ];
    for (const bytes of nearMisses) {
      resetMocks();
      serve(SOURCE, bytes, { "content-type": "image/png" });

      const response = await save();

      expect(response.status).toBe(400);
      expect(blob.puts).toHaveLength(0);
    }
  });

  test("accepts a declared Content-Length of exactly 10MB", async () => {
    const image = Buffer.concat([PNG, Buffer.alloc(10 * MB - PNG.length, 7)]);
    serve(SOURCE, image, { "content-length": String(10 * MB) });

    const response = await save();

    expect(response.status).toBe(201);
    expect(blob.puts[0].body.length).toBe(10 * MB);
  });

  test("does not follow a Location header on an error response", async () => {
    const target = "https://pbxt.replicate.delivery/final/out.png";
    network.routes.set(
      SOURCE,
      () =>
        new Response("bad request", {
          status: 400,
          headers: { location: target },
        })
    );
    serve(target, PNG);

    const response = await save();

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Failed to fetch image from source URL.",
    });
    expect(requestedUrls()).toEqual([SOURCE]);
    expect(blob.puts).toHaveLength(0);
  });

  test("says why an untrusted source URL was refused", async () => {
    const response = await save("https://evil.example/out.png");

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Image URL is not from a trusted source.",
    });
  });

  test("says why an unsupported file was refused", async () => {
    serve(SOURCE, HTML, { "content-type": "image/png" });

    const response = await save();

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error:
        "Source file is not a supported image (PNG, JPEG or WebP up to 10MB).",
    });
  });
});

describe("POST /api/gallery: releases upstream bodies it does not use", () => {
  // The shared fetch mock tees bodies like Next.js does, so a cancel() on the
  // route's branch never reaches the source. These tests swap in a plain fetch
  // for one request so the source stream can observe the cancel.
  async function withPlainFetch(
    routes: Record<string, () => Response>,
    run: () => Promise<void>
  ) {
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: string | URL | Request) => {
      const url = input instanceof Request ? input.url : String(input);
      const respond = routes[url];
      if (!respond) {
        throw new Error(`Unexpected network request in a test: ${url}`);
      }
      return respond();
    }) as typeof fetch;
    try {
      await run();
    } finally {
      globalThis.fetch = original;
    }
  }

  function trackedBody(firstBytes?: Uint8Array) {
    const state = { cancelled: false, pulls: 0 };
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        state.pulls += 1;
        if (state.pulls > 64) return controller.close();
        const chunk = new Uint8Array(MB).fill(1);
        if (state.pulls === 1 && firstBytes) chunk.set(firstBytes);
        controller.enqueue(chunk);
      },
      cancel() {
        state.cancelled = true;
      },
    });
    return { stream, state };
  }

  const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

  test("cancels the body of each redirect hop", async () => {
    const target = "https://pbxt.replicate.delivery/final/out.png";
    const hop = trackedBody();
    await withPlainFetch(
      {
        [SOURCE]: () =>
          new Response(hop.stream, {
            status: 302,
            headers: { location: target },
          }),
        [target]: () => new Response(new Uint8Array(PNG)),
      },
      async () => {
        expect((await save()).status).toBe(201);
      }
    );
    await settle();
    expect(hop.state.cancelled).toBe(true);
  });

  test("cancels the body of a failed upstream response", async () => {
    const missing = trackedBody();
    await withPlainFetch(
      { [SOURCE]: () => new Response(missing.stream, { status: 404 }) },
      async () => {
        expect((await save()).status).toBe(400);
      }
    );
    await settle();
    expect(missing.state.cancelled).toBe(true);
  });

  test("cancels a body whose declared Content-Length is over 10MB", async () => {
    const oversized = trackedBody(PNG.subarray(0, 8));
    await withPlainFetch(
      {
        [SOURCE]: () =>
          new Response(oversized.stream, {
            headers: { "content-length": String(10 * MB + 1) },
          }),
      },
      async () => {
        expect((await save()).status).toBe(400);
      }
    );
    await settle();
    expect(oversized.state.cancelled).toBe(true);
  });

  test("cancels a streamed body once it passes 10MB", async () => {
    const oversized = trackedBody(PNG.subarray(0, 8));
    await withPlainFetch(
      { [SOURCE]: () => new Response(oversized.stream) },
      async () => {
        expect((await save()).status).toBe(400);
      }
    );
    await settle();
    expect(oversized.state.cancelled).toBe(true);
  });
});

describe("DELETE /api/gallery: ordering and normalization", () => {
  test("does not read the body of an unauthenticated request", async () => {
    const request = jsonRequest("DELETE", "/api/gallery", {
      url: `${BLOB_ORIGIN}/designs/a.png`,
    });

    const response = await DELETE(request);

    expect(response.status).toBe(401);
    expect(request.bodyUsed).toBe(false);
  });

  test("deletes the normalized URL it validated, not the raw input", async () => {
    signInAsAdmin();
    const cases: [string, string][] = [
      [`${BLOB_ORIGIN}/other/../designs/a.png`, `${BLOB_ORIGIN}/designs/a.png`],
      [
        "HTTPS://TESTSTORE.PUBLIC.BLOB.VERCEL-STORAGE.COM/designs/a.png",
        `${BLOB_ORIGIN}/designs/a.png`,
      ],
    ];
    for (const [input, normalized] of cases) {
      blob.deleted.length = 0;

      const response = await remove(input);

      expect(response.status).toBe(200);
      expect(blob.deleted).toEqual([normalized]);
    }
  });
});

describe("gallery listing cache", () => {
  const DESIGN_URL = `${BLOB_ORIGIN}/designs/1700000000000_Modern_Bedroom.png`;

  async function listedCount(): Promise<number> {
    return (await listDesignsCached()).length;
  }

  test("repeated listings do not each query the Blob store", async () => {
    blob.listed = [
      {
        pathname: "designs/1700000000000_Modern_Bedroom.png",
        url: DESIGN_URL,
        uploadedAt: new Date("2026-01-01T00:00:00Z"),
      },
    ];

    for (let i = 0; i < 25; i++) expect(await listedCount()).toBe(1);

    expect(blob.listCalls).toHaveLength(1);
  });

  test("a saved design shows up in the next listing", async () => {
    expect(await listedCount()).toBe(0);

    serve(SOURCE, PNG);
    expect((await save()).status).toBe(201);
    const { pathname } = blob.puts[0];
    blob.listed = [
      { pathname, url: `${BLOB_ORIGIN}/${pathname}`, uploadedAt: new Date() },
    ];

    expect(nextCache.revalidations).toHaveLength(1);
    expect(await listedCount()).toBe(1);
  });

  test("a deleted design is gone from the next listing", async () => {
    blob.listed = [
      {
        pathname: "designs/1700000000000_Modern_Bedroom.png",
        url: DESIGN_URL,
        uploadedAt: new Date("2026-01-01T00:00:00Z"),
      },
    ];
    expect(await listedCount()).toBe(1);

    signInAsAdmin();
    expect((await remove(DESIGN_URL)).status).toBe(200);
    blob.listed = [];

    expect(nextCache.revalidations).toHaveLength(1);
    expect(await listedCount()).toBe(0);
  });

  test("a failed upload leaves the cache alone", async () => {
    serve(SOURCE, PNG);
    blob.error = new Error("Vercel Blob: store unavailable");

    expect((await save()).status).toBe(500);
    expect(nextCache.revalidations).toHaveLength(0);
  });

  test("the route offers no public listing endpoint", () => {
    // A GET handler here would list the Blob store for anyone who asks.
    expect("GET" in galleryRoute).toBe(false);
    expect("HEAD" in galleryRoute).toBe(false);
  });

  test("failed and refused requests leave the cache alone", async () => {
    // Refused save: untrusted URL. Failed save: not an image.
    await save("https://evil.example/out.png");
    serve(SOURCE, Buffer.from("<html></html>"));
    await save();
    // Refused delete: not signed in. Failed delete: Blob error.
    await remove(DESIGN_URL);
    signInAsAdmin();
    blob.error = new Error("Vercel Blob: store unavailable");
    await remove(DESIGN_URL);

    expect(nextCache.revalidations).toHaveLength(0);
  });
});
