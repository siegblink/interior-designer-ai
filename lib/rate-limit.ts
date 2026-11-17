import { NextResponse } from "next/server";
import { clientAddress } from "@/lib/client-address";

/**
 * In-process rate limits for the public API routes.
 *
 * What this does and does not guarantee: counts live in this server process
 * only. One `next start` process enforces them exactly until it restarts. On
 * Vercel every function instance keeps its own counts, and a new deployment
 * or cold start begins from zero, so the real ceiling is these numbers times
 * the number of live instances. Treat them as a speed bump that stops a single
 * script on a warm instance, not as a guarantee. The guarantees come from the
 * Vercel Firewall rule (per IP, at the edge) and the Replicate prepaid balance
 * (total spend); see README > Abuse protection.
 */

export interface RateLimit {
  /** Names the counter. */
  name: string;
  /** Requests allowed at once; also how many are restored per period. */
  limit: number;
  /** Time in which the full limit is restored, in seconds. */
  periodSeconds: number;
  /** Shown to the user when the limit is reached. */
  message: string;
  /** Shown instead when the limit is 0, which turns the feature off. */
  offMessage?: string;
}

/** Design generations per client: 10 at once, then one every 6 minutes. */
export const GENERATE_PER_CLIENT: RateLimit = {
  name: "generate",
  limit: 10,
  periodSeconds: 60 * 60,
  message: "You have generated a lot of designs in a short time.",
};

/**
 * Gallery saves per client: 5 at once, then one every 12 minutes. Kept below
 * the daily budget for everyone, so one visitor cannot use it up in one go.
 */
export const GALLERY_SAVE_PER_CLIENT: RateLimit = {
  name: "gallery-save",
  limit: 5,
  periodSeconds: 60 * 60,
  message: "You have saved a lot of designs in a short time.",
};

/** Admin sign-in attempts per client: 5 at once, then one every 3 minutes. */
export const ADMIN_SIGN_IN_PER_CLIENT: RateLimit = {
  name: "admin-sign-in",
  limit: 5,
  periodSeconds: 15 * 60,
  message: "Too many sign-in attempts.",
};

const DAY_SECONDS = 24 * 60 * 60;

const warnedBudgets = new Set<string>();

/**
 * A daily budget from the environment. Unset or blank gives the default, 0
 * turns the feature off, and anything else that is not a whole number gives
 * the default with a warning.
 */
function dailyBudget(name: string, fallback: number): number {
  const value = process.env[name]?.trim();
  if (!value) return fallback;
  const parsed = Number(value);
  if (Number.isSafeInteger(parsed) && parsed >= 0) return parsed;
  if (!warnedBudgets.has(name)) {
    warnedBudgets.add(name);
    console.warn(
      `${name} must be a whole number of 0 or more; using ${fallback}.`
    );
  }
  return fallback;
}

/**
 * Generations by all visitors together, per day. This, not the per-client
 * limit, is what bounds the Replicate bill when a client rotates IP addresses.
 * Read on every call so GENERATION_DAILY_LIMIT can be changed per deployment.
 */
export function generationBudget(): RateLimit {
  return {
    name: "generate-all",
    limit: dailyBudget("GENERATION_DAILY_LIMIT", 200),
    periodSeconds: DAY_SECONDS,
    message: "The demo has reached its daily limit of designs.",
    offMessage: "Generating designs is turned off.",
  };
}

/**
 * Gallery uploads by all visitors together, per day. Each save costs two Blob
 * Advanced Operations: the upload, and the listing the next gallery visit
 * makes. Hobby includes 2,000 a month and blocks Blob for 30 days once they
 * run out, so the default leaves room for the periodic refresh and for /admin.
 */
export function gallerySaveBudget(): RateLimit {
  return {
    name: "gallery-save-all",
    limit: dailyBudget("GALLERY_SAVE_DAILY_LIMIT", 10),
    periodSeconds: DAY_SECONDS,
    message: "The gallery has reached its daily limit of saves.",
    offMessage: "Saving to the gallery is turned off.",
  };
}

// --- Counters ----------------------------------------------------------------
//
// Generic cell rate algorithm (GCRA), the token bucket expressed as one
// timestamp per key: the time at which the bucket will be full again. A key
// may make `limit` requests at once, then one more every period / limit.
// Unlike a fixed window it never allows a double burst across a window edge,
// and a refused client waits one interval, not until a window ends.

/** Per-client keys kept at most; about 2 MB. The least recently seen go first. */
const MAX_CLIENT_KEYS = 10_000;

const clientBuckets = new Map<string, number>();
// Global budgets live apart from per-client keys so that a flood of client
// addresses can never evict (and so reset) them.
const globalBuckets = new Map<string, number>();

/** Takes one request; returns 0 if allowed, else milliseconds until it would be. */
function take(
  buckets: Map<string, number>,
  key: string,
  limit: RateLimit,
  now: number
): number {
  const periodMs = limit.periodSeconds * 1000;
  const intervalMs = periodMs / limit.limit;
  const fullAt = Math.max(buckets.get(key) ?? now, now);
  const waitMs = fullAt + intervalMs - periodMs - now;

  // Re-inserting moves the key to the end, so Map order is least recently seen first.
  buckets.delete(key);
  buckets.set(key, waitMs > 0 ? fullAt : fullAt + intervalMs);
  return Math.max(0, waitMs);
}

function tooManyRequests(limit: RateLimit, waitMs: number): NextResponse {
  const seconds = Math.max(1, Math.ceil(waitMs / 1000));
  const minutes = Math.ceil(seconds / 60);
  const wait =
    minutes <= 1
      ? "a minute"
      : minutes < 120
        ? `${minutes} minutes`
        : `${Math.ceil(minutes / 60)} hours`;
  return NextResponse.json(
    { error: `${limit.message} Please try again in ${wait}.` },
    { status: 429, headers: { "Retry-After": String(seconds) } }
  );
}

/**
 * Counts `request` against a per-client limit. Returns a 429 response when the
 * client has none left, else null. Skipped (null) when the client's address
 * is not known: see clientAddress().
 */
export function limitClient(
  limit: RateLimit,
  request: Request
): NextResponse | null {
  const address = clientAddress(request);
  if (!address) return null;

  const key = `${limit.name}:${address}`;
  if (!clientBuckets.has(key) && clientBuckets.size >= MAX_CLIENT_KEYS) {
    clientBuckets.delete(clientBuckets.keys().next().value as string);
  }
  const waitMs = take(clientBuckets, key, limit, Date.now());
  return waitMs > 0 ? tooManyRequests(limit, waitMs) : null;
}

const lastBudgetWarning = new Map<string, number>();

/**
 * A 503 response when a budget of 0 has turned the feature off, else null.
 * Routes call this before doing any work for the request.
 */
export function turnedOff(limit: RateLimit): NextResponse | null {
  if (limit.limit !== 0) return null;
  return NextResponse.json(
    { error: limit.offMessage ?? "This feature is turned off." },
    { status: 503 }
  );
}

/** Counts one request against a budget shared by all clients. */
export function limitGlobal(limit: RateLimit): NextResponse | null {
  // take() cannot divide by a limit of 0.
  const off = turnedOff(limit);
  if (off) return off;

  const now = Date.now();
  const waitMs = take(globalBuckets, limit.name, limit, now);
  if (waitMs <= 0) return null;

  // Tell the owner which budget ran out, at most once every 10 minutes.
  if (now - (lastBudgetWarning.get(limit.name) ?? -Infinity) >= 600_000) {
    lastBudgetWarning.set(limit.name, now);
    console.warn(`Budget "${limit.name}" (${limit.limit} a day) is spent.`);
  }
  return tooManyRequests(limit, waitMs);
}

/**
 * Gives back one request taken by limitGlobal(). Only for calls that were
 * refused before any paid work started, such as a rejected API token.
 */
export function refundGlobal(limit: RateLimit): void {
  const fullAt = globalBuckets.get(limit.name);
  if (fullAt === undefined || limit.limit === 0) return;
  const intervalMs = (limit.periodSeconds * 1000) / limit.limit;
  globalBuckets.set(limit.name, fullAt - intervalMs);
}

/** Clears every counter. For tests. */
export function resetRateLimits(): void {
  clientBuckets.clear();
  globalBuckets.clear();
  lastBudgetWarning.clear();
  warnedBudgets.clear();
}
