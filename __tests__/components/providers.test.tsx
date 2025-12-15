import { render } from "@testing-library/react";
import { SessionProvider } from "next-auth/react";
import { Providers } from "@/app/providers";

jest.mock("next-auth/react", () => ({
  SessionProvider: jest.fn(({ children }) => <div>{children}</div>),
}));

describe("Providers", () => {
  it("should render SessionProvider with children", () => {
    const { container } = render(
      <Providers>
        <div>Test Content</div>
      </Providers>
    );

    expect(SessionProvider).toHaveBeenCalled();
    expect(container.textContent).toBe("Test Content");
  });

  it("should wrap multiple children", () => {
    const { container } = render(
      <Providers>
        <div>Child 1</div>
        <div>Child 2</div>
      </Providers>
    );

    expect(container.textContent).toContain("Child 1");
    expect(container.textContent).toContain("Child 2");
  });
});
