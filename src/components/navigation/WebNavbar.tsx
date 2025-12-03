"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import Navbar, { type LinkItem, type LinkComp } from "./Navbar";

// Base menu items
const BASE_ITEMS: LinkItem[] = [
  { href: "/", label: "Home" },
  { href: "/your-tools", label: "YourTools" },

  // ⬇️ CHANGED: was "/profile-review"
  { href: "/profile", label: "Your Profile" },

  { href: "/mba/tools/bschool-match", label: "B-School Match" },
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

  const items: LinkItem[] = [...BASE_ITEMS];

  if (!session) {
    // Not logged in → show Login chip
    items.push({
      href: "#login",
      label: "Login",
      onClick: () => {
        signIn("google");
      },
    });
  } else {
    // Logged in
    if (session.user?.email && session.user.email === adminEmail) {
      items.push({
        href: "/admin/dashboard",
        label: "Admin Access",
      });
    }

    items.push({
      href: "#logout",
      label: "Logout",
      onClick: () => {
        signOut({ callbackUrl: "/" });
      },
    });
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
