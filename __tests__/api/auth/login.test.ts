import { POST } from "@/app/api/auth/login/route";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      json: async () => body,
      status: init?.status || 200,
      statusText: init?.statusText || "OK",
    })),
  },
}));

describe("/api/auth/login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 if user is not authenticated", async () => {
    (auth as jest.Mock).mockResolvedValue(null);

    const request = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized. Please sign in to continue.");
  });

  it("should return user data if authenticated", async () => {
    const mockSession = {
      user: {
        id: "123",
        name: "Test User",
        email: "test@example.com",
        image: "https://example.com/avatar.jpg",
      },
    };

    (auth as jest.Mock).mockResolvedValue(mockSession);

    const request = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user).toEqual({
      id: "123",
      name: "Test User",
      email: "test@example.com",
      image: "https://example.com/avatar.jpg",
    });
  });

  it("should return 500 on server error", async () => {
    (auth as jest.Mock).mockRejectedValue(new Error("Server error"));

    const request = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal server error. Please try again later.");
  });
});
