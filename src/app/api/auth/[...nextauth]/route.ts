import NextAuth from "next-auth";

const handler = NextAuth({
  providers: [], // add Email/Google later
  session: { strategy: "jwt" }
});

export { handler as GET, handler as POST };

