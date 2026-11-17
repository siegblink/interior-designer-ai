import {
  ADMIN_SECRET,
  blob,
  consoleSpies,
  jsonRequest,
  network,
  replicate,
  resetMocks,
} from "./setup";
import { beforeEach, describe, expect, setSystemTime, test } from "bun:test";
import { clientAddress } from "@/lib/client-address";
import { generationErrorMessage } from "@/lib/generation";
import {
  GALLERY_SAVE_PER_CLIENT,
  GENERATE_PER_CLIENT,
  gallerySaveBudget,
  generationBudget,
  limitClient,
  limitGlobal,
  refundGlobal,
  type RateLimit,
} from "@/lib/rate-limit";

const { POST: generatePOST } = await import("@/app/api/replicate/route");
const { POST: galleryPOST } = await import("@/app/api/gallery/route");
const { POST: signInPOST } = await import("@/app/api/admin/auth/route");

const PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const SOURCE = "https://replicate.delivery/pbxt/abc/out.png";
const PNG = Buffer.concat([
  Buffer.from("89504e470d0a1a0a", "hex"),
  Buffer.alloc(64, 1),
]);
const T0 = new Date("2026-11-17T12:00:00Z");

function from(ip: string, extra: Record<string, string> = {}) {
  return { "x-real-ip": ip, ...extra };
}

function generate(headers: Record<string, string> = {}, body?: unknown) {
  return generatePOST(
    jsonRequest(
      "POST",
      "/api/replicate",
      body ?? { image: PNG_DATA_URL, theme: "Modern", room: "Kitchen" },
      headers
    )
  );
}

function request(headers: Record<string, string>) {
  return new Request("http://localhost/api/replicate", { headers });
}

beforeEach(() => {
  resetMocks();
  setSystemTime(T0);
  replicate.result = ["https://replicate.delivery/a.png"];
});

describe("clientAddress", () => {
  test("on Vercel, reads x-real-ip and ignores client-sent forwarding headers", () => {
    process.env.VERCEL = "1";
    delete process.env.TRUSTED_IP_HEADER;
    const req = request({
      "x-real-ip": "203.0.113.7",
      "x-forwarded-for": "198.51.100.1",
    });
    expect(clientAddress(req)).toBe("203.0.113.7");
  });

  test("off Vercel, trusts no header unless TRUSTED_IP_HEADER names one", () => {
    delete process.env.TRUSTED_IP_HEADER;
    const req = request({
      "x-real-ip": "203.0.113.7",
      "x-forwarded-for": "203.0.113.7",
    });
    expect(clientAddress(req)).toBeNull();

    process.env.TRUSTED_IP_HEADER = "X-Client-IP";
    expect(clientAddress(request({ "x-client-ip": "203.0.113.9" }))).toBe(
      "203.0.113.9"
    );
  });

  test("keys IPv6 by /64 and IPv4-mapped addresses as IPv4", () => {
    expect(clientAddress(request(from("2001:db8:1:2:aaaa::1")))).toBe(
      "2001:db8:1:2::/64"
    );
    expect(clientAddress(request(from("2001:DB8:1:2:ffff:0:0:9")))).toBe(
      "2001:db8:1:2::/64"
    );
    expect(clientAddress(request(from("2001:db8::1")))).toBe(
      "2001:db8:0:0::/64"
    );
    expect(clientAddress(request(from("::ffff:203.0.113.7")))).toBe(
      "203.0.113.7"
    );
  });

  test("recognises an IPv4-mapped address in any spelling", () => {
    const spellings = [
      "::ffff:1.2.3.4",
      "::ffff:102:304",
      "::ffff:0102:0304",
      "0:0:0:0:0:ffff:1.2.3.4",
      "0:0:0:0:0:ffff:102:304",
      "::ffff:0:1.2.3.4",
    ];
    for (const spelling of spellings) {
      expect(clientAddress(request(from(spelling)))).toBe("1.2.3.4");
    }
    expect(clientAddress(request(from("::ffff:c000:201")))).toBe("192.0.2.1");
    expect(clientAddress(request(from("::ffff:1.2.3.4%eth0")))).toBe("1.2.3.4");
  });

  test("does not mistake other addresses in ::/64 for IPv4-mapped ones", () => {
    const addresses = [
      "0:0:0:1:0:ffff:102:304",
      "::1:ffff:102:304",
      "::ffff:1:102:304",
    ];
    for (const address of addresses) {
      expect(clientAddress(request(from(address)))).toEndWith("::/64");
    }
    expect(clientAddress(request(from("0:0:0:1:0:ffff:102:304")))).toBe(
      "0:0:0:1::/64"
    );
  });

  test("counts a dotted IPv4 tail as two groups", () => {
    expect(clientAddress(request(from("1:2::4:5:6:1.2.3.4")))).toBe(
      "1:2:0:4::/64"
    );
    expect(clientAddress(request(from("::1")))).toBe("0:0:0:0::/64");
    expect(clientAddress(request(from("fe80::1%eth0")))).toBe(
      "fe80:0:0:0::/64"
    );
  });

  test("treats a value that is not one IP address as unknown", () => {
    for (const value of ["", "unknown", "1.2.3.4, 5.6.7.8", "1.2.3"]) {
      expect(clientAddress(request(from(value)))).toBeNull();
    }
  });
});

describe("limits", () => {
  const LIMIT: RateLimit = {
    name: "test",
    limit: 3,
    periodSeconds: 60,
    message: "Slow down.",
  };

  test("allows a burst of `limit`, then one per period / limit", async () => {
    const req = request(from("203.0.113.7"));
    for (let i = 0; i < 3; i++) expect(limitClient(LIMIT, req)).toBeNull();

    const refused = limitClient(LIMIT, req);
    expect(refused?.status).toBe(429);
    expect(refused?.headers.get("retry-after")).toBe("20");
    expect(await refused?.json()).toEqual({
      error: "Slow down. Please try again in a minute.",
    });

    // Refusals do not push the next allowed request further out.
    setSystemTime(new Date(T0.getTime() + 20_000));
    expect(limitClient(LIMIT, req)).toBeNull();
    expect(limitClient(LIMIT, req)?.status).toBe(429);
  });

  test("counts each client separately and skips unknown clients", () => {
    for (let i = 0; i < 3; i++)
      limitClient(LIMIT, request(from("203.0.113.7")));
    expect(limitClient(LIMIT, request(from("203.0.113.7")))?.status).toBe(429);
    expect(limitClient(LIMIT, request(from("203.0.113.8")))).toBeNull();
    for (let i = 0; i < 10; i++) {
      expect(limitClient(LIMIT, request({}))).toBeNull();
    }
  });

  test("a flood of client addresses cannot reset a global budget", () => {
    for (let i = 0; i < 3; i++) expect(limitGlobal(LIMIT)).toBeNull();
    for (let i = 0; i < 12_000; i++) {
      limitClient(LIMIT, request(from(`10.0.${i >> 8}.${i & 255}`)));
    }
    expect(limitGlobal(LIMIT)?.status).toBe(429);
  });

  test("states long waits in hours", async () => {
    const day: RateLimit = { ...LIMIT, limit: 1, periodSeconds: 86_400 };
    limitGlobal(day);
    expect(await limitGlobal(day)?.json()).toEqual({
      error: "Slow down. Please try again in 24 hours.",
    });
  });

  test("the daily budgets default to 200 generations and 10 gallery saves", () => {
    expect(generationBudget()).toMatchObject({
      limit: 200,
      periodSeconds: 86_400,
    });
    expect(gallerySaveBudget()).toMatchObject({
      limit: 10,
      periodSeconds: 86_400,
    });
  });

  test("the environment overrides a daily budget; 0 turns the feature off", () => {
    process.env.GENERATION_DAILY_LIMIT = "50";
    process.env.GALLERY_SAVE_DAILY_LIMIT = " 5 ";
    expect(generationBudget().limit).toBe(50);
    expect(gallerySaveBudget().limit).toBe(5);

    process.env.GENERATION_DAILY_LIMIT = "0";
    expect(generationBudget().limit).toBe(0);
  });

  test("warns once about an invalid override, and again after a reset", () => {
    process.env.GENERATION_DAILY_LIMIT = "lots";
    generationBudget();
    generationBudget();
    expect(consoleSpies.warn).toHaveBeenCalledTimes(1);
    expect(consoleSpies.warn).toHaveBeenCalledWith(
      "GENERATION_DAILY_LIMIT must be a whole number of 0 or more; using 200."
    );

    resetMocks();
    process.env.GENERATION_DAILY_LIMIT = "lots";
    generationBudget();
    expect(consoleSpies.warn).toHaveBeenCalledTimes(1);
  });

  test("a blank or invalid override gives the default", () => {
    for (const value of ["", "  ", "-5", "abc", "1.5", "Infinity"]) {
      process.env.GENERATION_DAILY_LIMIT = value;
      process.env.GALLERY_SAVE_DAILY_LIMIT = value;
      expect(generationBudget().limit).toBe(200);
      expect(gallerySaveBudget().limit).toBe(10);
    }
  });

  test("an idle client gets back at most `limit` requests", () => {
    const req = request(from("203.0.113.7"));
    expect(limitClient(LIMIT, req)).toBeNull();

    setSystemTime(new Date(T0.getTime() + 24 * 3_600_000));
    for (let i = 0; i < 3; i++) expect(limitClient(LIMIT, req)).toBeNull();
    expect(limitClient(LIMIT, req)?.status).toBe(429);
  });

  test("keeps at most 10,000 clients, forgetting the least recently seen", () => {
    const one: RateLimit = { ...LIMIT, limit: 1, periodSeconds: 3600 };
    function flood(start: number, count: number) {
      for (let i = start; i < start + count; i++) {
        const ip = `10.${i >> 16}.${(i >> 8) & 255}.${i & 255}`;
        limitClient(one, request(from(ip)));
      }
    }

    limitClient(one, request(from("203.0.113.7")));
    flood(0, 9_999);
    // Still remembered, and being seen again makes it the most recent.
    expect(limitClient(one, request(from("203.0.113.7")))?.status).toBe(429);
    flood(9_999, 1);
    expect(limitClient(one, request(from("203.0.113.7")))?.status).toBe(429);
    // 10,000 newer clients push it out.
    flood(20_000, 10_000);
    expect(limitClient(one, request(from("203.0.113.7")))).toBeNull();
  });

  test("a refunded request can be made again, but never more than the limit", () => {
    for (let i = 0; i < 3; i++) expect(limitGlobal(LIMIT)).toBeNull();
    expect(limitGlobal(LIMIT)?.status).toBe(429);

    refundGlobal(LIMIT);
    expect(limitGlobal(LIMIT)).toBeNull();
    expect(limitGlobal(LIMIT)?.status).toBe(429);

    // Refunding a budget nothing was taken from changes nothing.
    refundGlobal({ ...LIMIT, name: "untouched" });
    for (let i = 0; i < 3; i++) {
      expect(limitGlobal({ ...LIMIT, name: "untouched" })).toBeNull();
    }
    expect(limitGlobal({ ...LIMIT, name: "untouched" })?.status).toBe(429);
  });
});

describe("POST /api/replicate limits", () => {
  test("refuses an 11th generation from one client before running the model", async () => {
    for (let i = 0; i < GENERATE_PER_CLIENT.limit; i++) {
      expect((await generate(from("203.0.113.7"))).status).toBe(201);
    }
    const refused = await generate(from("203.0.113.7"));
    expect(refused.status).toBe(429);
    expect(refused.headers.get("retry-after")).toBe("360");
    expect(replicate.runs).toHaveLength(10);

    expect((await generate(from("203.0.113.8"))).status).toBe(201);
  });

  test("stops everyone once the daily budget is spent; invalid requests spend none", async () => {
    process.env.GENERATION_DAILY_LIMIT = "3";
    for (let i = 0; i < 20; i++) {
      expect((await generate({}, { image: "nope" })).status).toBe(400);
    }
    for (let i = 0; i < 3; i++) {
      expect((await generate(from(`198.51.100.${i}`))).status).toBe(201);
    }
    const refused = await generate(from("198.51.100.99"));
    expect(refused.status).toBe(429);
    expect((await refused.json()).error).toStartWith(
      "The demo has reached its daily limit of designs."
    );
    expect(replicate.runs).toHaveLength(3);
  });

  test("a refused generation does not read the request body", async () => {
    for (let i = 0; i < GENERATE_PER_CLIENT.limit; i++) {
      await generate(from("203.0.113.7"));
    }
    const req = jsonRequest(
      "POST",
      "/api/replicate",
      { image: PNG_DATA_URL, theme: "Modern", room: "Kitchen" },
      from("203.0.113.7")
    );

    expect((await generatePOST(req)).status).toBe(429);
    expect(req.bodyUsed).toBe(false);
  });

  test("a spent daily budget stays spent for hours, not minutes", async () => {
    process.env.GENERATION_DAILY_LIMIT = "3";
    for (let i = 0; i < 3; i++) {
      expect((await generate(from(`198.51.100.${i}`))).status).toBe(201);
    }

    setSystemTime(new Date(T0.getTime() + 3_600_000));
    expect((await generate(from("198.51.100.50"))).status).toBe(429);

    // One of three is restored every 8 hours.
    setSystemTime(new Date(T0.getTime() + 8 * 3_600_000));
    expect((await generate(from("198.51.100.51"))).status).toBe(201);
  });

  test("a daily limit of 0 switches generation off and says so", async () => {
    process.env.GENERATION_DAILY_LIMIT = "0";

    const refused = await generate(from("203.0.113.7"));

    // Not a 429: there is no point in telling visitors to try again later.
    expect(refused.status).toBe(503);
    expect(refused.headers.get("retry-after")).toBeNull();
    expect(await refused.json()).toEqual({
      error: "Generating designs is turned off.",
    });
    expect(replicate.runs).toHaveLength(0);
    expect(consoleSpies.warn).not.toHaveBeenCalled();
  });

  test("a refund gives back exactly one generation", async () => {
    process.env.GENERATION_DAILY_LIMIT = "3";
    expect((await generate()).status).toBe(201);
    expect((await generate()).status).toBe(201);

    replicate.error = Object.assign(new Error("refused"), {
      response: new Response(null, { status: 401 }),
    });
    expect((await generate()).status).toBe(401);

    replicate.error = null;
    expect((await generate()).status).toBe(201);
    expect((await generate()).status).toBe(429);
  });

  test("warns the owner when the daily budget is spent, at most every 10 minutes", async () => {
    process.env.GENERATION_DAILY_LIMIT = "1";
    await generate();

    await generate();
    await generate();
    expect(consoleSpies.warn).toHaveBeenCalledTimes(1);
    expect(consoleSpies.warn).toHaveBeenCalledWith(
      'Budget "generate-all" (1 a day) is spent.'
    );

    setSystemTime(new Date(T0.getTime() + 9 * 60_000));
    await generate();
    expect(consoleSpies.warn).toHaveBeenCalledTimes(1);

    setSystemTime(new Date(T0.getTime() + 10 * 60_000));
    await generate();
    expect(consoleSpies.warn).toHaveBeenCalledTimes(2);
  });

  test("gives the budget back when Replicate refuses to start a prediction", async () => {
    process.env.GENERATION_DAILY_LIMIT = "3";
    for (const status of [401, 402, 402, 401, 402]) {
      replicate.error = Object.assign(new Error("refused"), {
        response: new Response(null, { status }),
      });
      expect((await generate()).status).toBe(status);
    }

    replicate.error = null;
    for (let i = 0; i < 3; i++) expect((await generate()).status).toBe(201);
    expect((await generate()).status).toBe(429);
  });

  test("keeps the budget spent when a prediction ran and failed", async () => {
    process.env.GENERATION_DAILY_LIMIT = "2";
    replicate.error = new Error("Prediction failed: out of memory");
    expect((await generate()).status).toBe(500);
    replicate.error = Object.assign(new Error("rate limited"), {
      response: new Response(null, { status: 429 }),
    });
    expect((await generate()).status).toBe(429);

    replicate.error = null;
    const refused = await generate();
    expect(refused.status).toBe(429);
    expect((await refused.json()).error).toStartWith(
      "The demo has reached its daily limit"
    );
  });

  test("refuses requests a browser sent from another site", async () => {
    for (const site of ["cross-site", "same-site"]) {
      const response = await generate({ "sec-fetch-site": site });
      expect(response.status).toBe(403);
    }
    expect(replicate.runs).toHaveLength(0);
    expect((await generate({ "sec-fetch-site": "same-origin" })).status).toBe(
      201
    );
  });
});

describe("POST /api/gallery limits", () => {
  function save(headers: Record<string, string> = {}, imageUrl = SOURCE) {
    if (!network.routes.has(SOURCE)) {
      network.routes.set(SOURCE, () => new Response(new Uint8Array(PNG)));
    }
    return galleryPOST(
      jsonRequest(
        "POST",
        "/api/gallery",
        { imageUrl, theme: "Modern", room: "Kitchen" },
        headers
      )
    );
  }

  test("refuses a 6th save from one client before fetching anything", async () => {
    process.env.GALLERY_SAVE_DAILY_LIMIT = "100";
    for (let i = 0; i < 5; i++) {
      expect((await save(from("203.0.113.7"))).status).toBe(201);
    }

    const refused = await save(from("203.0.113.7"));

    expect(refused.status).toBe(429);
    expect(refused.headers.get("retry-after")).toBe("720");
    expect(network.requests).toHaveLength(5);
    expect(blob.puts).toHaveLength(5);
    expect((await save(from("203.0.113.8"))).status).toBe(201);
  });

  test("one client cannot use up the default daily save budget in one go", async () => {
    expect(GALLERY_SAVE_PER_CLIENT.limit).toBeLessThan(
      gallerySaveBudget().limit
    );
    for (let i = 0; i < 20; i++) await save(from("203.0.113.7"));

    expect((await save(from("203.0.113.8"))).status).toBe(201);
  });

  test("a daily limit of 0 switches saving off before anything is fetched", async () => {
    process.env.GALLERY_SAVE_DAILY_LIMIT = "0";

    const refused = await save(from("203.0.113.7"));

    expect(refused.status).toBe(503);
    expect(refused.headers.get("retry-after")).toBeNull();
    expect(await refused.json()).toEqual({
      error: "Saving to the gallery is turned off.",
    });
    expect(network.requests).toHaveLength(0);
    expect(blob.puts).toHaveLength(0);
  });

  test("generations and gallery saves are counted separately", async () => {
    process.env.GALLERY_SAVE_DAILY_LIMIT = "100";
    for (let i = 0; i < 10; i++) await save(from("203.0.113.7"));
    for (let i = 0; i < GENERATE_PER_CLIENT.limit; i++) {
      expect((await generate(from("203.0.113.7"))).status).toBe(201);
    }

    const refused = await generate(from("203.0.113.7"));

    expect(refused.status).toBe(429);
    expect((await refused.json()).error).toStartWith(
      "You have generated a lot of designs"
    );
  });

  test("a spent save budget stays spent for hours", async () => {
    process.env.GALLERY_SAVE_DAILY_LIMIT = "2";
    expect((await save()).status).toBe(201);
    expect((await save()).status).toBe(201);

    setSystemTime(new Date(T0.getTime() + 3_600_000));
    expect((await save()).status).toBe(429);

    setSystemTime(new Date(T0.getTime() + 12 * 3_600_000));
    expect((await save()).status).toBe(201);
  });

  test("refused and invalid saves do not spend the save budget", async () => {
    process.env.GALLERY_SAVE_DAILY_LIMIT = "1";
    expect((await save({}, "https://evil.example/x.png")).status).toBe(400);
    network.routes.set(
      SOURCE,
      () => new Response(new Uint8Array(Buffer.from("<html></html>")))
    );
    expect((await save()).status).toBe(400);

    network.routes.set(SOURCE, () => new Response(new Uint8Array(PNG)));
    expect((await save()).status).toBe(201);
    expect((await save()).status).toBe(429);
  });

  test("caps uploads per day across all clients", async () => {
    process.env.GALLERY_SAVE_DAILY_LIMIT = "2";
    expect((await save(from("203.0.113.1"))).status).toBe(201);
    expect((await save(from("203.0.113.2"))).status).toBe(201);
    expect((await save(from("203.0.113.3"))).status).toBe(429);
    expect(blob.puts).toHaveLength(2);
  });

  test("refuses cross-site saves before fetching anything", async () => {
    const response = await save({ "sec-fetch-site": "cross-site" });
    expect(response.status).toBe(403);
    expect(network.requests).toHaveLength(0);
  });
});

describe("POST /api/admin/auth limits", () => {
  test("another site cannot use up the admin's sign-in attempts", async () => {
    for (let i = 0; i < 10; i++) {
      const response = await signInPOST(
        jsonRequest(
          "POST",
          "/api/admin/auth",
          { password: "guess" },
          from("203.0.113.7", { "sec-fetch-site": "cross-site" })
        )
      );
      expect(response.status).toBe(403);
    }

    const response = await signInPOST(
      jsonRequest(
        "POST",
        "/api/admin/auth",
        { password: ADMIN_SECRET },
        from("203.0.113.7", { "sec-fetch-site": "same-origin" })
      )
    );
    expect(response.status).toBe(200);
  });

  test("refuses a 6th attempt in a burst, even with the right password", async () => {
    for (let i = 0; i < 5; i++) {
      const response = await signInPOST(
        jsonRequest(
          "POST",
          "/api/admin/auth",
          { password: "guess" },
          from("203.0.113.7")
        )
      );
      expect(response.status).toBe(401);
    }
    const response = await signInPOST(
      jsonRequest(
        "POST",
        "/api/admin/auth",
        { password: ADMIN_SECRET },
        from("203.0.113.7")
      )
    );
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("180");
  });
});

describe("generationErrorMessage for firewall responses", () => {
  test("explains a 429 or 403 the platform answered without JSON", () => {
    expect(generationErrorMessage(429, null)).toBe(
      "Too many requests. Please wait a few minutes and try again."
    );
    expect(generationErrorMessage(403, null)).toBe(
      "This request was blocked. Reload the page and try again."
    );
    expect(generationErrorMessage(429, { error: "Ours" })).toBe("Ours");
  });
});
