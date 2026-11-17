import { ADMIN_SECRET, jsonRequest, rawRequest, resetMocks } from "./setup";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  isAdminSession,
} from "@/lib/admin-session";

const { POST, DELETE } = await import("@/app/api/admin/auth/route");

const env = process.env as Record<string, string | undefined>;
const originalNodeEnv = env.NODE_ENV;

beforeEach(resetMocks);
afterEach(() => {
  env.NODE_ENV = originalNodeEnv;
});

function signIn(body: unknown) {
  return POST(jsonRequest("POST", "/api/admin/auth", body));
}

describe("POST /api/admin/auth", () => {
  test("signs in with the correct password and sets a session cookie", async () => {
    const response = await signIn({ password: ADMIN_SECRET });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });

    const cookie = response.cookies.get(ADMIN_SESSION_COOKIE);
    expect(cookie).toBeDefined();
    expect(isAdminSession(cookie?.value)).toBe(true);
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("strict");
    expect(cookie?.path).toBe("/");
    expect(cookie?.maxAge).toBe(ADMIN_SESSION_MAX_AGE);
  });

  test("never puts the password in the cookie", async () => {
    const response = await signIn({ password: ADMIN_SECRET });

    expect(response.cookies.get(ADMIN_SESSION_COOKIE)?.value).not.toContain(
      ADMIN_SECRET
    );
    expect(response.headers.get("set-cookie")).not.toContain(ADMIN_SECRET);
  });

  test("marks the cookie Secure only in production", async () => {
    env.NODE_ENV = "production";
    const production = await signIn({ password: ADMIN_SECRET });
    expect(production.cookies.get(ADMIN_SESSION_COOKIE)?.secure).toBe(true);

    env.NODE_ENV = "development";
    const development = await signIn({ password: ADMIN_SECRET });
    expect(development.cookies.get(ADMIN_SESSION_COOKIE)?.secure).toBe(false);
  });

  test("rejects wrong, missing and non-string passwords without a cookie", async () => {
    const bodies = [
      { password: "wrong" },
      { password: "" },
      { password: null },
      { password: 12345 },
      { password: [ADMIN_SECRET] },
      { password: { value: ADMIN_SECRET } },
      {},
      null,
      "just a string",
      [ADMIN_SECRET],
    ];

    for (const body of bodies) {
      const response = await signIn(body);
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "Invalid password" });
      expect(response.headers.get("set-cookie")).toBeNull();
    }
  });

  test("rejects a malformed JSON body with 401 instead of crashing", async () => {
    const response = await POST(
      rawRequest("POST", "/api/admin/auth", "{not json")
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  test("rejects every password when no admin secret is configured", async () => {
    for (const secret of [undefined, ""]) {
      if (secret === undefined) delete process.env.GALLERY_ADMIN_SECRET;
      else process.env.GALLERY_ADMIN_SECRET = secret;

      for (const password of ["", "undefined", ADMIN_SECRET]) {
        const response = await signIn({ password });
        expect(response.status).toBe(401);
        expect(response.headers.get("set-cookie")).toBeNull();
      }
    }
  });
});

describe("DELETE /api/admin/auth", () => {
  test("clears the session cookie", async () => {
    const response = await DELETE();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });

    const cookie = response.cookies.get(ADMIN_SESSION_COOKIE);
    expect(cookie?.value).toBe("");
    expect(cookie?.expires).toEqual(new Date(0));
  });
});
