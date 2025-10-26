'use client';

import { useState, type ReactNode, type ReactElement } from 'react';

export type LinkItem = { href: string; label: string };

export type LinkComp = (props: {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) => ReactElement;

export default function Navbar({
  items,
  LinkComponent,
  activeHref,
  colors = { bg: '#EFEFEF' },   // a little more grey than before (#F2F2F2 -> #EFEFEF)
  navText = '#6C6C6C',
  brand = {
    name: 'ADMIT55',
    href: '/',
    logoSrc: '/logo/admit55logo.webp',
    logoAlt: 'Admit55 logo',
    nameColor: '#A3A3A3',
  },
}: {
  items: LinkItem[];
  LinkComponent: LinkComp;
  activeHref?: string;
  colors?: { bg: string };
  navText?: string;
  brand?: { name: string; href: string; logoSrc?: string; logoAlt?: string; nameColor?: string };
}): ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundColor: colors.bg,
        borderColor: 'rgba(0,0,0,0.08)',
        height: 72,                 // 🔒 navbar height unchanged
        overflow: 'visible',        // allow visual overflow if needed
      }}
    >
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-4"
        style={{ height: '100%' }}
      >
        {/* Brand */}
        <LinkComponent href={brand.href} className="flex items-center gap-3">
          {brand.logoSrc ? (
            <img
              src={brand.logoSrc}
              alt={brand.logoAlt ?? 'logo'}
              style={{
                display: 'block',
                width: 72,
                height: 72,
                objectFit: 'contain',
                // Visually bigger logo without changing layout height:
                transform: 'scale(1.15)',      // ~15% larger
                transformOrigin: 'left center' // grows to the right, stays centered vertically
              }}
            />
          ) : (
            <div
              style={{
                width: 72,
                height: 72,
                backgroundColor: '#A3A3A3',
                transform: 'scale(1.15)',
                transformOrigin: 'left center'
              }}
            />
          )}
          <span className="text-base md:text-lg font-semibold" style={{ color: brand.nameColor ?? '#A3A3A3' }}>
            {brand.name}
          </span>
        </LinkComponent>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-6 md:flex">
          {items.map(({ href, label }) => {
            const active = activeHref === href;
            return (
              <li key={href}>
                <LinkComponent
                  href={href}
                  className={`text-sm transition-opacity ${active ? 'font-semibold' : 'opacity-90 hover:opacity-100'}`}
                >
                  <span style={{ color: navText }}>{label}</span>
                </LinkComponent>
              </li>
            );
          })}
        </ul>

        {/* Mobile toggle */}
        <button
          className="md:hidden rounded-md p-2"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          style={{ color: navText }}
        >
          ☰
        </button>
      </nav>

      {/* Mobile panel */}
      {open && (
        <div
          className="md:hidden border-t"
          style={{
            backgroundColor: colors.bg,
            borderColor: 'rgba(0,0,0,0.08)'
          }}
        >
          <ul className="px-4 py-3 space-y-2">
            {items.map(({ href, label }) => (
              <li key={href}>
                <LinkComponent
                  href={href}
                  className="block rounded-md px-2 py-2 text-sm"
                  onClick={() => setOpen(false)}
                >
                  <span style={{ color: navText }}>{label}</span>
                </LinkComponent>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
