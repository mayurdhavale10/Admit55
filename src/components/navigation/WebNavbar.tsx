"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar, { type LinkItem, type LinkComp } from "./Navbar";

// Base menu items (no auth items here)
const BASE_ITEMS: LinkItem[] = [
  { href: "/", label: "Home" },
  { href: "/your-tools", label: "YourTools" },
  { href: "/profile-review", label: "Profile Review" },
  { href: "/b-school-match", label: "B-School Match" },
  { href: "/alum-coaches", label: "Alum Coaches" },
  { href: "/contact", label: "Contact" },
];

const NextLink: LinkComp = ({ href, children, className, onClick }) => (
  <Link href={href} className={className} onClick={onClick}>
    {children}
  </Link>
);

export default function WebNavbar() {
  const pathname = usePathname() ?? "/";
  const { data: session } = useSession();

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  // Start with base items
  const items: LinkItem[] = [...BASE_ITEMS];

  if (!session) {
    // Not logged in → show Login chip
    items.push({ href: "/api/auth/signin", label: "Login" });
  } else {
    // Logged in
    if (session.user?.email && session.user.email === adminEmail) {
      // Admin email → show Admin Access chip
      items.push({ href: "/admin/dashboard", label: "Admin Access" });
    } else {
      // Normal logged-in user – optional:
      // items.push({ href: "/profile", label: "My Account" });
    }
  }

  return (
    <Navbar
      items={items}
      LinkComponent={NextLink}
      activeHref={pathname}
      navText="#FFFFFF"
      brand={{
        name: "ADMIT55",
        href: "/",
        logoSrc: "/logo/admit55_final_logo.webp",
        logoAlt: "Admit55 logo",
        nameColor: "#003366",
      }}
    />
  );
}
