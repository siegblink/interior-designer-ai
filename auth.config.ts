import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

/**
 * NextAuth configuration
 */
export const authConfig: NextAuthConfig = {
  providers: [
    // GitHub provider
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID || "",
      clientSecret: process.env.AUTH_GITHUB_SECRET || "",
    }),

    // Google provider
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || "",
    }),
  ],

  // Configure pages for authentication
  pages: {
    signIn: "/login",
  },

  // Configure callbacks for authentication
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at
            ? account.expires_at * 1000
            : null,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          },
        };
      }
      return token;
    },

    // Configure session for authentication
    async session({ session, token }) {
      if (session.user && token.user) {
        session.user = {
          ...session.user,
          id: (token.user as { id: string }).id,
        };
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
};
