/**
 * Shared test harness. bunfig.toml preloads it before every test file, and
 * test files import its exports:
 *
 *   import { blob, resetMocks } from "./setup";
 *
 * It guarantees that no test reaches a real service: credentials are replaced
 * with dummies, the Replicate and Vercel Blob SDKs, `next/headers` and
 * `next/cache` are mocked, and `fetch` only serves URLs a test registered. Load route modules
 * with `await import(...)` after importing this file so they get the mocks.
 */
import { afterEach, beforeEach, mock, setSystemTime, spyOn } from "bun:test";

export const ADMIN_SECRET = "test-admin-secret";
export const REPLICATE_TOKEN = "test-replicate-token";
export const BLOB_ORIGIN = "https://teststore.public.blob.vercel-storage.com";

function setTestEnv(): void {
  process.env.GALLERY_ADMIN_SECRET = ADMIN_SECRET;
  process.env.REPLICATE_API_TOKEN = REPLICATE_TOKEN;
  process.env.BLOB_READ_WRITE_TOKEN = "test-blob-token";
  // @vercel/blob sends requests through undici, not globalThis.fetch, so the
  // fetch mock below cannot stop it. Should the real SDK ever be loaded, point
  // it at a closed local port instead of the Blob API.
  process.env.VERCEL_BLOB_API_URL = "http://127.0.0.1:9";
  process.env.VERCEL_BLOB_RETRIES = "0";
  // Per-client rate limits key on x-real-ip here. Requests built without that
  // header are not limited per client; tests that pass one are.
  delete process.env.VERCEL;
  process.env.TRUSTED_IP_HEADER = "x-real-ip";
  delete process.env.GENERATION_DAILY_LIMIT;
  delete process.env.GALLERY_SAVE_DAILY_LIMIT;
}
setTestEnv();

// The routes log prompts and errors; keep the test output readable.
export const consoleSpies = {
  log: spyOn(console, "log").mockImplementation(() => {}),
  error: spyOn(console, "error").mockImplementation(() => {}),
  warn: spyOn(console, "warn").mockImplementation(() => {}),
};

// --- Vercel Blob -----------------------------------------------------------

export interface ListedBlob {
  pathname: string;
  url: string;
  uploadedAt: Date;
}

export const blob = {
  /** Every put() call, in order. */
  puts: [] as {
    pathname: string;
    body: Buffer;
    access?: string;
    contentType?: string;
  }[],
  /** Every argument del() was called with. */
  deleted: [] as unknown[],
  /** Options of every list() call. */
  listCalls: [] as { prefix?: string; cursor?: string }[],
  /** The blobs in the store; list() returns them a page at a time. */
  listed: [] as ListedBlob[],
  /** How many blobs list() returns per call (the real API's limit is 1000). */
  pageSize: 1000,
  /** When set, a list() call started now waits for it before answering. */
  listHold: null as Promise<void> | null,
  /** When set, every Blob call rejects with it. */
  error: null as Error | null,
};

mock.module("@vercel/blob", () => ({
  async put(
    pathname: string,
    body: Buffer,
    options?: { access?: string; contentType?: string }
  ) {
    if (blob.error) throw blob.error;
    blob.puts.push({
      pathname,
      body: Buffer.from(body),
      access: options?.access,
      contentType: options?.contentType,
    });
    return { url: `${BLOB_ORIGIN}/${pathname}`, pathname };
  },
  async list(options: { prefix?: string; cursor?: string } = {}) {
    blob.listCalls.push(options);
    const hold = blob.listHold;
    if (hold) await hold;
    if (blob.error) throw blob.error;
    const start = options.cursor ? Number(options.cursor) : 0;
    const end = Math.min(start + blob.pageSize, blob.listed.length);
    const hasMore = end < blob.listed.length;
    return {
      blobs: blob.listed.slice(start, end),
      hasMore,
      cursor: hasMore ? String(end) : undefined,
    };
  },
  async del(url: unknown) {
    if (blob.error) throw blob.error;
    blob.deleted.push(url);
  },
}));

// --- next/headers ----------------------------------------------------------

/** Cookies the mocked `cookies()` store exposes to route handlers. */
export const cookieJar = new Map<string, string>();

mock.module("next/headers", () => ({
  async cookies() {
    return {
      get(name: string) {
        const value = cookieJar.get(name);
        return value === undefined ? undefined : { name, value };
      },
    };
  },
}));

// --- next/cache ------------------------------------------------------------

export const nextCache = {
  /** Every revalidateTag() call, in order. */
  revalidations: [] as { tag: string; profile: unknown }[],
};

const cacheEntries = new Map<
  string,
  { value: string; tags: string[]; expiresAt: number }
>();

// A small stand-in for Next.js's data cache. Like the real one it stores JSON,
// reuses a result until one of its tags is revalidated or `revalidate`
// seconds have passed, does not cache a rejected call and refuses
// `revalidate: 0`. Unlike the real one it does not merge anything and, once an
// entry has expired, reloads it straight away instead of serving it once more.
mock.module("next/cache", () => ({
  unstable_cache<Args extends unknown[], Result>(
    load: (...args: Args) => Promise<Result>,
    keyParts: string[] = [],
    options: { tags?: string[]; revalidate?: number | false } = {}
  ) {
    if (options.revalidate === 0) {
      throw new Error(
        "Invariant revalidate: 0 can not be passed to unstable_cache()"
      );
    }
    return async (...args: Args): Promise<Result> => {
      const key = JSON.stringify([keyParts, args]);
      const hit = cacheEntries.get(key);
      if (hit && Date.now() < hit.expiresAt) {
        return JSON.parse(hit.value) as Result;
      }
      const value = await load(...args);
      cacheEntries.set(key, {
        value: JSON.stringify(value),
        tags: options.tags ?? [],
        expiresAt:
          typeof options.revalidate === "number"
            ? Date.now() + options.revalidate * 1000
            : Infinity,
      });
      return value;
    };
  },
  revalidateTag(tag: string, profile: unknown) {
    nextCache.revalidations.push({ tag, profile });
    for (const [key, entry] of cacheEntries) {
      if (entry.tags.includes(tag)) cacheEntries.delete(key);
    }
  },
}));

// --- Replicate -------------------------------------------------------------

interface ReplicateOptions {
  auth?: string;
  useFileOutput?: boolean;
  fetch?: typeof fetch;
}

export const replicate = {
  /** Options passed to every `new Replicate(...)`. */
  constructed: [] as ReplicateOptions[],
  /** Every run() call, in order. */
  runs: [] as { model: string; input: Record<string, unknown> }[],
  /** What the model returns: run() resolves with it. */
  result: [] as unknown,
  /** When set, run() rejects with it. */
  error: null as unknown,
};

class ReplicateMock {
  private readonly useFileOutput: boolean;
  private readonly fetch: typeof fetch;

  constructor(options: ReplicateOptions = {}) {
    replicate.constructed.push(options);
    // Same defaults as the SDK.
    this.useFileOutput = options.useFileOutput !== false;
    this.fetch = options.fetch ?? globalThis.fetch;
  }

  async run(model: string, options: { input: Record<string, unknown> }) {
    replicate.runs.push({ model, input: options.input });
    if (replicate.error) throw replicate.error;

    const result = replicate.result;
    if (!this.useFileOutput || !Array.isArray(result)) return result;

    // Like the SDK's FileOutput: unless useFileOutput is false, every output
    // URL becomes an object that starts downloading the file immediately.
    return result.map((value) => {
      if (typeof value !== "string" || !/^(https?|data):/.test(value)) {
        return value;
      }
      this.fetch(value).catch(() => {});
      return { toString: () => value };
    });
  }
}

mock.module("replicate", () => ({ default: ReplicateMock }));

// --- fetch -----------------------------------------------------------------

export const network = {
  /** URL -> response factory. Requests for any other URL throw. */
  routes: new Map<string, () => Response>(),
  /** Every fetch() call, in order. */
  requests: [] as { url: string; redirect?: RequestRedirect }[],
};

const retainedBranches: ReadableStream[] = [];

async function fetchMock(
  input: string | URL | Request,
  init?: RequestInit
): Promise<Response> {
  const url = input instanceof Request ? input.url : String(input);
  network.requests.push({ url, redirect: init?.redirect });

  const respond = network.routes.get(url);
  if (!respond) {
    throw new Error(`Unexpected network request in a test: ${url}`);
  }

  const original = respond();
  if (!original.body) return original;

  // Next.js gives route handlers one branch of a tee'd response body and keeps
  // the other. cancel() on a single branch never settles, so code that awaits
  // it hangs here exactly as it would in the running app.
  const [kept, returned] = original.body.tee();
  retainedBranches.push(kept);
  return new Response(returned, {
    status: original.status,
    statusText: original.statusText,
    headers: original.headers,
  });
}

globalThis.fetch = fetchMock as typeof fetch;

const { resetRateLimits } = await import("@/lib/rate-limit");

// --- helpers ---------------------------------------------------------------

/** Restores every mock and the test environment. */
export function resetMocks(): void {
  setTestEnv();
  blob.puts.length = 0;
  blob.deleted.length = 0;
  blob.listCalls.length = 0;
  blob.listed = [];
  blob.pageSize = 1000;
  blob.listHold = null;
  blob.error = null;
  cookieJar.clear();
  replicate.constructed.length = 0;
  replicate.runs.length = 0;
  replicate.result = [];
  replicate.error = null;
  network.routes.clear();
  network.requests.length = 0;
  retainedBranches.length = 0;
  nextCache.revalidations.length = 0;
  for (const spy of Object.values(consoleSpies)) spy.mockClear();
  cacheEntries.clear();
  resetRateLimits();
}

// This file is preloaded, so these hooks run around every test in every file:
// no mock state, environment change or fake clock leaks into the next test.
beforeEach(resetMocks);
afterEach(() => {
  setSystemTime();
  resetMocks();
});

/** Builds a JSON request for a route handler. */
export function jsonRequest(
  method: string,
  path: string,
  body: unknown,
  headers: Record<string, string> = {}
): Request {
  return new Request(`http://localhost${path}`, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

/** Builds a request whose body is sent as-is (e.g. malformed JSON). */
export function rawRequest(
  method: string,
  path: string,
  body: string
): Request {
  return new Request(`http://localhost${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body,
  });
}
