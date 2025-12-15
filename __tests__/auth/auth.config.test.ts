// Mock NextAuth providers before importing
jest.mock("next-auth/providers/github", () => ({
  __esModule: true,
  default: jest.fn(() => ({ id: "github", name: "GitHub" })),
}));

jest.mock("next-auth/providers/google", () => ({
  __esModule: true,
  default: jest.fn(() => ({ id: "google", name: "Google" })),
}));

import { authConfig } from "@/auth.config";

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  process.env = {
    ...originalEnv,
    AUTH_GITHUB_ID: "test_github_id",
    AUTH_GITHUB_SECRET: "test_github_secret",
    AUTH_GOOGLE_ID: "test_google_id",
    AUTH_GOOGLE_SECRET: "test_google_secret",
  };
});

afterEach(() => {
  process.env = originalEnv;
});

describe("authConfig", () => {
  it("should have correct structure", () => {
    expect(authConfig).toHaveProperty("providers");
    expect(authConfig).toHaveProperty("pages");
    expect(authConfig).toHaveProperty("callbacks");
  });

  it("should have GitHub and Google providers", () => {
    expect(authConfig.providers).toHaveLength(2);
    expect(authConfig.providers[0]).toBeDefined();
    expect(authConfig.providers[1]).toBeDefined();
  });

  it("should have signIn page configured", () => {
    expect(authConfig.pages?.signIn).toBe("/login");
  });

  it("should have JWT callback", () => {
    expect(authConfig.callbacks?.jwt).toBeDefined();
    expect(typeof authConfig.callbacks?.jwt).toBe("function");
  });

  it("should have session callback", () => {
    expect(authConfig.callbacks?.session).toBeDefined();
    expect(typeof authConfig.callbacks?.session).toBe("function");
  });

  describe("JWT callback", () => {
    it("should add user data and tokens on initial sign in", async () => {
      const jwtCallback = authConfig.callbacks?.jwt;
      if (!jwtCallback) {
        throw new Error("JWT callback not defined");
      }

      const token = {};
      const user = {
        id: "123",
        name: "Test User",
        email: "test@example.com",
        image: "https://example.com/avatar.jpg",
      };
      const account = {
        access_token: "access_token_123",
        refresh_token: "refresh_token_123",
        expires_at: 1234567890,
      };

      const result = await jwtCallback({ token, user, account } as any);

      expect(result).toHaveProperty("accessToken", "access_token_123");
      expect(result).toHaveProperty("refreshToken", "refresh_token_123");
      expect(result).toHaveProperty("accessTokenExpires", 1234567890000);
      expect(result).toHaveProperty("user");
      expect((result as any).user).toEqual({
        id: "123",
        name: "Test User",
        email: "test@example.com",
        image: "https://example.com/avatar.jpg",
      });
    });

    it("should return token unchanged if no account or user", async () => {
      const jwtCallback = authConfig.callbacks?.jwt;
      if (!jwtCallback) {
        throw new Error("JWT callback not defined");
      }

      const token = { existing: "data" };

      const result = await jwtCallback({ token } as any);

      expect(result).toEqual({ existing: "data" });
    });

    it("should handle missing expires_at", async () => {
      const jwtCallback = authConfig.callbacks?.jwt;
      if (!jwtCallback) {
        throw new Error("JWT callback not defined");
      }

      const token = {};
      const user = { id: "123" };
      const account = {
        access_token: "access_token_123",
        refresh_token: "refresh_token_123",
      };

      const result = await jwtCallback({ token, user, account } as any);

      expect(result).toHaveProperty("accessTokenExpires", null);
    });
  });

  describe("Session callback", () => {
    it("should add user id and access token to session", async () => {
      const sessionCallback = authConfig.callbacks?.session;
      if (!sessionCallback) {
        throw new Error("Session callback not defined");
      }

      const session = {
        user: {
          name: "Test User",
          email: "test@example.com",
        },
      };
      const token = {
        user: { id: "123" },
        accessToken: "access_token_123",
      };

      const result = await sessionCallback({ session, token } as any);

      expect(result.user).toHaveProperty("id", "123");
      expect(result).toHaveProperty("accessToken", "access_token_123");
    });

    it("should return session unchanged if no token user", async () => {
      const sessionCallback = authConfig.callbacks?.session;
      if (!sessionCallback) {
        throw new Error("Session callback not defined");
      }

      const session = {
        user: {
          name: "Test User",
          email: "test@example.com",
        },
      };
      const token = {};

      const result = await sessionCallback({ session, token } as any);

      expect(result.user).not.toHaveProperty("id");
    });
  });
});
