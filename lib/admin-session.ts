import {
  createHash,
  createHmac,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, in seconds

let cachedKey: { secret: string; key: Buffer } | null = null;

/**
 * Signing key for session tokens. It is stretched from the admin password
 * with scrypt (once per process) instead of being the password itself, so a
 * leaked cookie cannot be used as a fast offline check for password guesses.
 */
function sessionKey(secret: string): Buffer {
  if (cachedKey?.secret !== secret) {
    cachedKey = {
      secret,
      key: scryptSync(secret, "interior-designer:admin-session:v1", 32),
    };
  }
  return cachedKey.key;
}

function signExpiry(expiresAt: number, secret: string): Buffer {
  return createHmac("sha256", sessionKey(secret))
    .update(`admin-session:${expiresAt}`)
    .digest();
}

/** Constant-time check of a submitted password against GALLERY_ADMIN_SECRET. */
export function isAdminPassword(password: unknown): boolean {
  const secret = process.env.GALLERY_ADMIN_SECRET;
  if (!secret || typeof password !== "string" || password.length === 0) {
    return false;
  }
  const submitted = createHash("sha256").update(password).digest();
  const expected = createHash("sha256").update(secret).digest();
  return timingSafeEqual(submitted, expected);
}

/**
 * Creates a signed, expiring session token (`<expiresAt>.<hmac>`), so the
 * cookie never holds the admin password itself. Changing GALLERY_ADMIN_SECRET
 * invalidates every existing session. Returns null when no secret is set.
 */
export function createAdminSession(): string | null {
  const secret = process.env.GALLERY_ADMIN_SECRET;
  if (!secret) return null;
  const expiresAt = Date.now() + ADMIN_SESSION_MAX_AGE * 1000;
  return `${expiresAt}.${signExpiry(expiresAt, secret).toString("hex")}`;
}

export function isAdminSession(value: string | undefined): boolean {
  const secret = process.env.GALLERY_ADMIN_SECRET;
  if (!secret || !value) return false;

  const parts = value.split(".");
  if (parts.length !== 2) return false;
  const [expiresRaw, signature] = parts;
  if (!/^\d+$/.test(expiresRaw) || !/^[0-9a-f]{64}$/.test(signature)) {
    return false;
  }

  const expiresAt = Number(expiresRaw);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now()) return false;

  const expected = signExpiry(expiresAt, secret);
  const provided = Buffer.from(signature, "hex");
  return (
    provided.length === expected.length && timingSafeEqual(provided, expected)
  );
}
