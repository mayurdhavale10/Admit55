// src/components/navigation/WebNavbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Navbar, { type LinkItem, type LinkComp } from "./Navbar";

// All menu items (no Dream B-Schools, no About)
const items: LinkItem[] = [
  { href: "/", label: "Home" },
  { href: "/your-tools", label: "YourTools" },
  { href: "/profile-review", label: "Profile Review" },
  { href: "/b-school-match", label: "B-School Match" },
  { href: "/alum-coaches", label: "Alum Coaches" },
  { href: "/contact", label: "Contact" },
  { href: "/api/auth/signin", label: "Login" },
];

const NextLink: LinkComp = ({ href, children, className, onClick }) => (
  <Link href={href} className={className} onClick={onClick}>
    {children}
  </Link>
);

export default function WebNavbar() {
  const pathname = usePathname() ?? "/";

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
