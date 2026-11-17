import { ADMIN_SECRET, resetMocks } from "./setup";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  setSystemTime,
  spyOn,
  test,
} from "bun:test";
import * as nodeCrypto from "node:crypto";
import { createHmac, scryptSync } from "node:crypto";
import {
  ADMIN_SESSION_MAX_AGE,
  createAdminSession,
  isAdminPassword,
  isAdminSession,
} from "@/lib/admin-session";

beforeEach(resetMocks);
afterEach(() => setSystemTime());

/** Signs an expiry the way lib/admin-session.ts does. */
function sign(expiresAt: number, secret = ADMIN_SECRET): string {
  const key = scryptSync(secret, "interior-designer:admin-session:v1", 32);
  return createHmac("sha256", key)
    .update(`admin-session:${expiresAt}`)
    .digest("hex");
}

function newSession(): string {
  const session = createAdminSession();
  if (!session) throw new Error("expected a session");
  return session;
}

describe("isAdminPassword", () => {
  test("accepts only the exact configured secret", () => {
    expect(isAdminPassword(ADMIN_SECRET)).toBe(true);
    expect(isAdminPassword(`${ADMIN_SECRET} `)).toBe(false);
    expect(isAdminPassword(ADMIN_SECRET.slice(0, -1))).toBe(false);
    expect(isAdminPassword(ADMIN_SECRET.toUpperCase())).toBe(false);
  });

  test("rejects empty and non-string values", () => {
    for (const value of ["", undefined, null, 0, true, {}, [ADMIN_SECRET]]) {
      expect(isAdminPassword(value)).toBe(false);
    }
  });

  test("rejects everything when no secret is configured", () => {
    for (const secret of [undefined, ""]) {
      if (secret === undefined) delete process.env.GALLERY_ADMIN_SECRET;
      else process.env.GALLERY_ADMIN_SECRET = secret;

      expect(isAdminPassword("")).toBe(false);
      expect(isAdminPassword("undefined")).toBe(false);
      expect(isAdminPassword(ADMIN_SECRET)).toBe(false);
    }
  });
});

describe("createAdminSession", () => {
  test("returns <expiresAt>.<64 hex chars>, 7 days out", () => {
    setSystemTime(new Date("2026-11-17T00:00:00Z"));
    const session = newSession();

    expect(session).toMatch(/^\d+\.[0-9a-f]{64}$/);
    const expiresAt = Number(session.split(".")[0]);
    expect(expiresAt).toBe(Date.now() + ADMIN_SESSION_MAX_AGE * 1000);
    expect(ADMIN_SESSION_MAX_AGE).toBe(7 * 24 * 60 * 60);
  });

  test("never contains the password", () => {
    expect(newSession()).not.toContain(ADMIN_SECRET);
  });

  test("is not signed with the raw password as the HMAC key", () => {
    // A signature keyed by the password itself would let anyone holding a
    // leaked cookie test password guesses offline at full HMAC speed.
    const [expiresAt, signature] = newSession().split(".");
    const keyedByPassword = createHmac("sha256", ADMIN_SECRET)
      .update(`admin-session:${expiresAt}`)
      .digest("hex");

    expect(signature).not.toBe(keyedByPassword);
    expect(isAdminSession(`${expiresAt}.${keyedByPassword}`)).toBe(false);
  });

  test("signs with a key stretched from the secret by scrypt", () => {
    // A fast hash of the password as the key would bring the offline-guessing
    // problem straight back, so the derivation itself is pinned here.
    const [expiresAt, signature] = newSession().split(".");
    expect(signature).toBe(sign(Number(expiresAt)));
  });

  test("returns null when no secret is configured", () => {
    delete process.env.GALLERY_ADMIN_SECRET;
    expect(createAdminSession()).toBeNull();
  });
});

describe("isAdminSession", () => {
  test("accepts a fresh session", () => {
    expect(isAdminSession(newSession())).toBe(true);
  });

  test("accepts a session until it expires, then rejects it", () => {
    const start = new Date("2026-11-17T00:00:00Z").getTime();
    setSystemTime(new Date(start));
    const session = newSession();
    const lifetime = ADMIN_SESSION_MAX_AGE * 1000;

    setSystemTime(new Date(start + lifetime - 1));
    expect(isAdminSession(session)).toBe(true);

    setSystemTime(new Date(start + lifetime));
    expect(isAdminSession(session)).toBe(false);

    setSystemTime(new Date(start + lifetime + 60_000));
    expect(isAdminSession(session)).toBe(false);
  });

  test("rejects a session whose expiry was changed", () => {
    const [expiresAt, signature] = newSession().split(".");
    expect(isAdminSession(`${Number(expiresAt) + 1}.${signature}`)).toBe(false);
    expect(isAdminSession(`${Number(expiresAt) - 1}.${signature}`)).toBe(false);
  });

  test("rejects a session whose signature was changed", () => {
    const [expiresAt, signature] = newSession().split(".");
    const flipped = (signature[0] === "0" ? "1" : "0") + signature.slice(1);
    expect(isAdminSession(`${expiresAt}.${flipped}`)).toBe(false);
  });

  test("rejects correctly signed expiries that are not safe integers", () => {
    const huge = "9".repeat(400); // Number(huge) is Infinity
    expect(isAdminSession(`${huge}.${sign(Number(huge))}`)).toBe(false);

    const unsafe = "9007199254740993"; // rounds to 2^53
    expect(isAdminSession(`${unsafe}.${sign(Number(unsafe))}`)).toBe(false);
  });

  test("rejects malformed values", () => {
    const [expiresAt, signature] = newSession().split(".");
    const malformed = [
      undefined,
      "",
      ".",
      ADMIN_SECRET,
      expiresAt,
      `${expiresAt}.`,
      `.${signature}`,
      `${expiresAt}.${signature}.extra`,
      `${expiresAt}.${signature.slice(0, -2)}`,
      `${expiresAt}.${signature}00`,
      `${expiresAt}.${signature.toUpperCase()}`,
      `${expiresAt}.${"z".repeat(64)}`,
      `-${expiresAt}.${signature}`,
      `1e99.${signature}`,
      `${"9".repeat(400)}.${signature}`,
      ` ${expiresAt}.${signature}`,
    ];
    for (const value of malformed) {
      expect(isAdminSession(value)).toBe(false);
    }
  });

  test("rejects sessions issued under a different secret", () => {
    const session = newSession();

    process.env.GALLERY_ADMIN_SECRET = "rotated-secret";
    expect(isAdminSession(session)).toBe(false);

    // Sessions issued under the new secret work, and going back restores the
    // old ones (the key depends only on the secret).
    expect(isAdminSession(newSession())).toBe(true);
    process.env.GALLERY_ADMIN_SECRET = ADMIN_SECRET;
    expect(isAdminSession(session)).toBe(true);
  });

  test("rejects every session when no secret is configured", () => {
    const session = newSession();
    delete process.env.GALLERY_ADMIN_SECRET;
    expect(isAdminSession(session)).toBe(false);
  });
});

describe("token strictness", () => {
  test("rejects trailing characters that Number() or Buffer.from(hex) would ignore", () => {
    const [expiresAt, signature] = newSession().split(".");
    const padded = [
      // Number(" 123 ") === 123, so only the regex keeps these out.
      `${expiresAt} .${signature}`,
      `${expiresAt}\n.${signature}`,
      // Buffer.from(hex) drops an odd trailing nibble and stops at the first
      // non-hex pair, so both still decode to the valid 32-byte signature.
      `${expiresAt}.${signature}0`,
      `${expiresAt}.${signature}zz`,
    ];
    for (const value of padded) {
      expect(isAdminSession(value)).toBe(false);
    }
  });
});

describe("constant-time comparisons", () => {
  test("isAdminPassword compares fixed-length digests with timingSafeEqual", () => {
    const spy = spyOn(nodeCrypto, "timingSafeEqual");
    try {
      expect(isAdminPassword("wrong")).toBe(false);
      expect(isAdminPassword(ADMIN_SECRET)).toBe(true);

      expect(spy).toHaveBeenCalledTimes(2);
      for (const [submitted, expected] of spy.mock.calls) {
        expect(submitted.byteLength).toBe(32);
        expect(expected.byteLength).toBe(32);
      }
    } finally {
      spy.mockRestore();
    }
  });

  test("isAdminSession compares the signature with timingSafeEqual", () => {
    const [expiresAt, signature] = newSession().split(".");
    const flipped = (signature[0] === "0" ? "1" : "0") + signature.slice(1);
    const spy = spyOn(nodeCrypto, "timingSafeEqual");
    try {
      expect(isAdminSession(`${expiresAt}.${signature}`)).toBe(true);
      expect(isAdminSession(`${expiresAt}.${flipped}`)).toBe(false);

      expect(spy).toHaveBeenCalledTimes(2);
    } finally {
      spy.mockRestore();
    }
  });
});
