// middleware.ts (at project root, e.g. C:/.../Admit55/admit55/middleware.ts)
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // ✅ Always allow the admin login page
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    // ✅ Check if current user is admin
    const isAdmin =
      !!token &&
      (token.email === ADMIN_EMAIL || (token as any).role === "admin");

    if (!isAdmin) {
      // Not admin → send to homepage (or you can send to /)
      return NextResponse.redirect(new URL("/", req.url));
    }

    // ✅ Admin can access
    return NextResponse.next();
  },
  {
    callbacks: {
      /**
       * Runs before the function above.
       * For /admin/login → always allow (even without token).
       * For other /admin/* → require a token (logged in).
       */
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Allow /admin/login even if not logged in
        if (pathname === "/admin/login") {
          return true;
        }

        // For any other /admin/* route, user must be logged in
        return !!token;
      },
    },
  }
);

// Apply to all /admin/* routes
export const config = {
  matcher: ["/admin/:path*"],
};
