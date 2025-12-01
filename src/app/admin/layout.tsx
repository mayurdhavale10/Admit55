// src/app/admin/layout.tsx
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata = {
  title: "Admin | Admit55",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Brand / Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold tracking-tight">
            Admit55 Admin
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Back-office dashboard
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span>📋</span>
            <span>Dashboard (Logged-in Users)</span>
          </Link>

          <Link
            href="/admin/sessions"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span>🗓️</span>
            <span>Booked Sessions</span>
          </Link>

          {/* Future items */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Coming soon
            </p>
            <div className="mt-1 space-y-1">
              <button
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-gray-400 cursor-not-allowed"
                disabled
              >
                <span>📊</span>
                <span>Analytics</span>
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-gray-400 cursor-not-allowed"
                disabled
              >
                <span>⚙️</span>
                <span>Settings</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Footer / small meta */}
        <div className="px-4 py-3 border-t border-gray-200 text-xs text-gray-400">
          © {new Date().getFullYear()} Admit55
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
