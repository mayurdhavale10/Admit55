'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Navbar, { type LinkItem } from '@src/components/navigation/Navbar';

const items: LinkItem[] = [
  { href: '/', label: 'Home' },
  { href: '/tools', label: 'Tools' },
  { href: '/consultation', label: '1:1consultation' },
  { href: '/contactus', label: 'Contactus' },
];

const NextLink = ({
  href,
  children,
  className,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) => (
  <Link href={href} className={className} onClick={onClick}>
    {children}
  </Link>
);

export default function WebNavbar() {
  const pathname = usePathname() ?? '/';
  return (
    <Navbar
      items={items}
      LinkComponent={NextLink}
      activeHref={pathname}
      colors={{ bg: '#EFEFEF' }}   // slightly darker grey than before
      navText="#6C6C6C"
      brand={{
        name: 'ADMIT55',
        href: '/',
        logoSrc: '/logo/admit55logo.webp',
        logoAlt: 'Admit55 logo',
        nameColor: '#A3A3A3',
      }}
    />
  );
}
