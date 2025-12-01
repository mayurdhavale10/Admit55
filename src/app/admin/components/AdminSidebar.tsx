"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type AdminSidebarProps = {
  className?: string;
};

type NavLink = {
  href: string;
  label: string;
  icon: string;
};

const links: NavLink[] = [
  {
    href: "/admin/dashboard",
    label: "Dashboard (Logged-in Users)",
    icon: "📋",
  },
  {
    href: "/admin/bookings",
    label: "Booked Sessions",
    icon: "📆",
  },
];

// Small util like in Navbar.tsx
function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const chipBase =
    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap";

  const chipGlassy = cn(
    chipBase,
    "border border-white/25 bg-white/10 hover:bg-white/15 text-slate-50"
  );

  const chipActive = cn(
    chipBase,
    "bg-[#00C875]/18 border-[#00C875]/40 ring-1 ring-[#00C875]/45 text-white shadow-sm"
  );

  return (
    <div
      className={cn(
        // glassy container
        "flex flex-col rounded-3xl border border-white/20 bg-white/10 shadow-xl",
        "backdrop-blur-xl backdrop-saturate-150",
        "text-slate-50",
        className
      )}
    >
      {/* Header */}
      <div className="border-b border-white/15 px-4 py-4 pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-200">
          ADMIT55 ADMIN
        </p>
        <p className="mt-1 text-sm text-slate-50/90">Back-office dashboard</p>
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-2 px-3 py-4 text-sm">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={isActive(link.href) ? chipActive : chipGlassy}
          >
            <span className="text-base">{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}

        {/* Coming soon */}
        <div className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300/80">
          Coming soon
        </div>

        <button
          type="button"
          className={cn(
            chipBase,
            "mt-1 w-full justify-start border border-white/20 bg-white/5 text-slate-100 hover:bg-white/10"
          )}
        >
          <span className="text-base">📊</span>
          <span>Analytics</span>
        </button>

        <button
          type="button"
          className={cn(
            chipBase,
            "w-full justify-start border border-white/20 bg-white/5 text-slate-100 hover:bg-white/10"
          )}
        >
          <span className="text-base">⚙️</span>
          <span>Settings</span>
        </button>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/15 px-4 py-3 text-[11px] text-slate-200/80">
        © {new Date().getFullYear()} Admit55
      </div>
    </div>
  );
}
