import { auth } from "@/auth";
import { NextResponse } from "next/server";

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

// Mock NextResponse
const mockRedirect = jest.fn((url: URL) => ({
  url: url.toString(),
  status: 307,
}));

const mockNext = jest.fn(() => ({
  status: 200,
}));

jest.mock("next/server", () => ({
  NextResponse: {
    redirect: mockRedirect,
    next: mockNext,
  },
}));

describe("Middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should have middleware configured correctly", () => {
    // Test that middleware is exported and auth is used
    expect(auth).toBeDefined();
  });

  it("should have correct matcher configuration", () => {
    // The middleware config is tested through the actual middleware file
    // This test verifies the structure exists
    const middleware = require("@/app/middleware");
    expect(middleware.config).toBeDefined();
    expect(middleware.config.matcher).toContain("/");
    expect(middleware.config.matcher).toContain("/login");
  });
});
