// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { type AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { connectDB } from "@src/lib/db/loggedinuser/connectDB";
import { upsertLoggedInUser } from "@src/lib/models/UserLoggedIn";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn("[Auth] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set");
}
if (!process.env.NEXTAUTH_SECRET) {
  console.warn("[Auth] NEXTAUTH_SECRET not set");
}

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    /**
     * Runs on sign-in. We:
     * 1) Ensure DB connection
     * 2) Upsert into logged_in_users collection
     * 3) Decide role (admin/user) based on ADMIN_EMAIL
     */
    async signIn({ user }) {
      try {
        if (!user?.email) {
          console.warn("[Auth] signIn without email – rejecting");
          return false;
        }

        await connectDB();

        const role = user.email === ADMIN_EMAIL ? "admin" : "user";

        await upsertLoggedInUser({
          email: user.email,
          name: user.name ?? null,
          image: (user as any).image ?? null,
          role,
        });

        return true; // allow sign in
      } catch (err) {
        console.error("[Auth] signIn error (still allowing login):", err);
        // If you want to block login on DB error, return false instead
        return true;
      }
    },

    /**
     * Attach role to JWT token
     */
    async jwt({ token, user }) {
      // On first sign in, user is defined
      if (user && user.email) {
        const role = user.email === ADMIN_EMAIL ? "admin" : "user";
        (token as any).role = role;
      }
      return token;
    },

    /**
     * Expose role on session.user
     */
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = (token as any).role ?? "user";
      }
      return session;
    },

    /**
     * After auth, just send them to home (you can later customize:
     * admin → /admin, others → /)
     */
    async redirect({ url, baseUrl }) {
      return baseUrl;
    },
  },

  // Optional: custom sign-in page later
  // pages: {
  //   signIn: "/login",
  // },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
