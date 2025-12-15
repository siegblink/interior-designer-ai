import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * Main NextAuth instance
 * Exports handlers for API routes, auth function for server-side session access,
 * and signIn/signOut functions for programmatic authentication
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true, // Required for production deployments
});
