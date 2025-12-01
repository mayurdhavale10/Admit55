import type { ReactNode } from "react";
import AdminSidebar from "./components/AdminSidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    // Dark/navy background (matches navbar)
    <div className="min-h-screen bg-[#0b1f4a]">
      {/* Push admin content down below navbar */}
      <div className="px-4 md:px-8 pt-20 md:pt-24 pb-12">
        <div className="flex w-full max-w-6xl gap-6">
          {/* Sidebar wrapper – sticky here */}
          <aside className="w-64 shrink-0">
            <div className="sticky top-24">
              <AdminSidebar />
            </div>
          </aside>

          {/* Main admin content */}
          <main className="flex-1">
            <div className="space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
