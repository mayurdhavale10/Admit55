// src/app/admin/upgrade-requests/page.tsx
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@src/app/api/auth/[...nextauth]/route";
import { getLoggedInUserByEmail } from "@src/models/auth/UserLoggedIn";

export default async function AdminUpgradeRequestsPage() {
  // Require login
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) redirect("/api/auth/signin?callbackUrl=/admin/upgrade-requests");

  // Require admin
  const me = await getLoggedInUserByEmail(email);
  if (me?.role !== "admin") redirect("/profile");

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full bg-gradient-to-b from-[#0A2540] to-[#1747D6] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Admin • Upgrade Requests
          </h1>
          <p className="text-blue-100/90 mt-2 text-sm">
            This page is ready. Next step: connect it to real upgrade requests storage.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-700">
            No upgrade-request system wired yet.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/admin/users"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Go to Users (upgrade manually)
            </Link>

            <Link
              href="/upgradetopro"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              View User Upgrade Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
