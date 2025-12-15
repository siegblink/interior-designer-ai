import { GET, POST } from "@/app/api/auth/[...nextauth]/route";
import { handlers } from "@/auth";

jest.mock("@/auth", () => ({
  handlers: {
    GET: jest.fn(),
    POST: jest.fn(),
  },
}));

describe("/api/auth/[...nextauth]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle GET requests", async () => {
    const mockResponse = {
      status: 200,
      json: async () => ({ ok: true }),
    };
    (handlers.GET as jest.Mock).mockResolvedValue(mockResponse);

    const request = new Request("http://localhost:3000/api/auth/session", {
      method: "GET",
    });

    const response = await GET(request);

    expect(handlers.GET).toHaveBeenCalled();
    expect(response).toBeDefined();
  });

  it("should handle POST requests", async () => {
    const mockResponse = {
      status: 200,
      json: async () => ({ ok: true }),
    };
    (handlers.POST as jest.Mock).mockResolvedValue(mockResponse);

    const request = new Request("http://localhost:3000/api/auth/signin", {
      method: "POST",
    });

    const response = await POST(request);

    expect(handlers.POST).toHaveBeenCalled();
    expect(response).toBeDefined();
  });
});
