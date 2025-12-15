import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import LoginPage from "@/app/login/page";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));

describe("LoginPage", () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
  });

  it("should render login page with GitHub and Google buttons", () => {
    render(<LoginPage />);

    expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
    expect(
      screen.getByText("Use your GitHub or Google account to continue")
    ).toBeInTheDocument();
    expect(screen.getByText("Sign in with GitHub")).toBeInTheDocument();
    expect(screen.getByText("Sign in with Google")).toBeInTheDocument();
  });

  it("should handle GitHub sign in successfully", async () => {
    (signIn as jest.Mock).mockResolvedValue({ ok: true, error: null });

    render(<LoginPage />);

    const githubButton = screen.getByText("Sign in with GitHub");
    fireEvent.click(githubButton);

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith("github", {
        redirect: false,
        callbackUrl: "/",
      });
      expect(mockPush).toHaveBeenCalledWith("/");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("should handle Google sign in successfully", async () => {
    (signIn as jest.Mock).mockResolvedValue({ ok: true, error: null });

    render(<LoginPage />);

    const googleButton = screen.getByText("Sign in with Google");
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith("google", {
        redirect: false,
        callbackUrl: "/",
      });
      expect(mockPush).toHaveBeenCalledWith("/");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("should display error message on failed sign in", async () => {
    (signIn as jest.Mock).mockResolvedValue({
      ok: false,
      error: "Authentication failed",
    });

    render(<LoginPage />);

    const githubButton = screen.getByText("Sign in with GitHub");
    fireEvent.click(githubButton);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to sign in. Please try again.")
      ).toBeInTheDocument();
    });
  });

  it("should handle button clicks during sign in", async () => {
    // Note: useTransition makes testing disabled state complex
    // This test verifies the sign in function is called correctly
    (signIn as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<LoginPage />);

    const githubButton = screen.getByText("Sign in with GitHub");
    fireEvent.click(githubButton);

    // Verify signIn was called with correct parameters
    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith("github", {
        redirect: false,
        callbackUrl: "/",
      });
    });
  });
});
