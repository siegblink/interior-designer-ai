"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { XCircleIcon } from "@heroicons/react/20/solid";

type AuthProvider = "github" | "google";

type ErrorState = {
  message: string;
  provider?: AuthProvider;
} | null;

/**
 * Login form component (wrapped in Suspense for useSearchParams)
 */
function LoginForm() {
  const [error, setError] = useState<ErrorState>(null);
  const [isPending, setIsPending] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const handleSignIn = async (provider: AuthProvider) => {
    try {
      setError(null);
      setIsPending(true);

      // For OAuth providers, we need to let NextAuth handle the redirect
      // This will redirect to the OAuth provider's login page
      // After authentication, user will be redirected to callbackUrl
      await signIn(provider, {
        callbackUrl,
      });
    } catch (err) {
      setError({
        message: "An unexpected error occurred. Please try again.",
        provider,
      });
      setIsPending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-900 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Use your GitHub or Google account to continue
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4" role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircleIcon
                  className="h-5 w-5 text-red-400"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  {error.message}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 space-y-4">
          <button
            type="button"
            onClick={() => handleSignIn("github")}
            disabled={isPending}
            aria-label="Sign in with GitHub"
            className={`${
              isPending
                ? "cursor-not-allowed bg-gray-600 opacity-50"
                : "bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            } group relative flex w-full justify-center rounded-md border border-transparent px-4 py-3 text-sm font-medium text-white transition-all duration-300`}
          >
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <svg
                className="h-5 w-5 text-gray-400 group-hover:text-gray-300"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            {isPending ? "Signing in..." : "Sign in with GitHub"}
          </button>

          <button
            type="button"
            onClick={() => handleSignIn("google")}
            disabled={isPending}
            aria-label="Sign in with Google"
            className={`${
              isPending
                ? "cursor-not-allowed bg-gray-600 opacity-50"
                : "bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            } group relative flex w-full justify-center rounded-md border border-transparent px-4 py-3 text-sm font-medium text-white transition-all duration-300`}
          >
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <svg
                className="h-5 w-5 text-gray-400 group-hover:text-gray-300"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </span>
            {isPending ? "Signing in..." : "Sign in with Google"}
          </button>
        </div>
      </div>
    </main>
  );
}

/**
 * Login page component
 * Provides OAuth authentication via GitHub and Google
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gray-900 px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8">
            <div>
              <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">
                Sign in to your account
              </h2>
              <p className="mt-2 text-center text-sm text-gray-400">
                Loading...
              </p>
            </div>
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
