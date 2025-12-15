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

describe("/api/auth/login - Edge Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 if session exists but user is missing", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: null });

    const request = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized. Please sign in to continue.");
  });

  it("should return 401 if session exists but user is undefined", async () => {
    (auth as jest.Mock).mockResolvedValue({});

    const request = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized. Please sign in to continue.");
  });

  it("should handle session with partial user data", async () => {
    const mockSession = {
      user: {
        id: "123",
        name: null,
        email: null,
        image: null,
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
      name: null,
      email: null,
      image: null,
    });
  });

  it("should handle session with only email", async () => {
    const mockSession = {
      user: {
        id: "123",
        name: null,
        email: "test@example.com",
        image: null,
      },
    };

    (auth as jest.Mock).mockResolvedValue(mockSession);

    const request = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user.email).toBe("test@example.com");
  });
});
