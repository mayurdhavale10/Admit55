"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  type ReactElement,
} from "react";

export type LinkItem = {
  href: string;
  label: string;
  onClick?: () => void;
};

export type LinkComp = (props: {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) => ReactElement;

type Brand = {
  name: string;
  href: string;
  logoSrc?: string;
  logoAlt?: string;
  nameColor?: string;
  logoScale?: number;
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const HEADER_HEIGHT = 84;
const LOGO_BOX = 56;
const LOGO_SCALE_DEFAULT = 1.0;
const SCROLL_THRESHOLD = 80;
const MD_BREAKPOINT = 768;

export default function Navbar({
  items,
  LinkComponent,
  activeHref,
  navText = "#003366",
  brand = {
    name: "",
    href: "/",
    logoSrc: "/logo/admit55_final_logo.webp",
    logoAlt: "Admit55 logo",
    nameColor: "#003366",
  },
}: {
  items: LinkItem[];
  LinkComponent: LinkComp;
  activeHref?: string;
  navText?: string;
  brand?: Brand;
}): ReactElement {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= MD_BREAKPOINT) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    document.body.style.overflow = mobileOpen ? "hidden" : "auto";
    return () => {
      window.removeEventListener("resize", onResize);
      document.body.style.overflow = "auto";
    };
  }, [mobileOpen]);

  const textColor = scrolled ? "#003366" : "#FFFFFF";

  const chipBase =
    "px-4 py-2 rounded-full border transition-colors text-sm font-medium inline-flex items-center whitespace-nowrap";
  const chipGlassy = cn(
    chipBase,
    scrolled
      ? "border-black/15 bg-white/60 hover:bg-white/70"
      : "border-white/25 bg-white/10 hover:bg-white/15",
  );
  const chipActive = cn(
    chipBase,
    "bg-[#00C875]/15 border-[#00C875]/30 ring-1 ring-[#00C875]/50",
  );

  const isActive = useCallback(
    (href: string) =>
      activeHref === href || (href !== "/" && activeHref?.startsWith(href)),
    [activeHref],
  );

  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const toggleMobile = useCallback(() => setMobileOpen((v) => !v), []);

  const mobilePanelId = "navbar-mobile-panel";
  const logoScale = brand.logoScale ?? LOGO_SCALE_DEFAULT;

  const CTA_HREF = "/mba/tools/profileresumetool";

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 overflow-hidden transition-colors",
          "pt-[max(0px,env(safe-area-inset-top))]",
          scrolled ? "backdrop-blur bg-white/70 border-b border-black/5" : "bg-transparent",
        )}
        style={{ height: `${HEADER_HEIGHT}px` }}
      >
        <nav className="w-full overflow-hidden px-0 grid grid-cols-[auto_1fr_auto] items-center h-full">
          
          {/* LEFT — BRAND */}
          <div className="pl-5 md:pl-6 flex items-center gap-2">
            <LinkComponent href={brand.href} className="flex items-center gap-2" onClick={closeMobile}>
              
              {brand.logoSrc && (
                <div
                  className="overflow-hidden flex items-center justify-center"
                  style={{ height: LOGO_BOX, width: LOGO_BOX }}
                >
                  <img
                    src={brand.logoSrc}
                    alt={brand.logoAlt ?? "logo"}
                    className="w-full h-full object-contain object-center"
                    style={{
                      transform: `scale(${logoScale})`,
                      transformOrigin: "center",
                      willChange: "transform",
                    }}
                  />
                </div>
              )}

              {brand.name && (
                <span
                  className="whitespace-nowrap font-semibold leading-none text-[18px] md:text-[22px] transition-colors duration-200"
                  style={{ color: scrolled ? brand.nameColor ?? "#003366" : "#FFFFFF" }}
                >
                  {brand.name}
                </span>
              )}
            </LinkComponent>
          </div>

          {/* CENTER MENU */}
          <div className="hidden md:flex items-center gap-3 justify-center px-3 md:px-5">
            {items.map(({ href, label, onClick }) => (
              <LinkComponent
                key={href + label}
                href={href}
                className={isActive(href) ? chipActive : chipGlassy}
                onClick={() => {
                  onClick?.();
                  closeMobile();
                }}
              >
                <span className="whitespace-nowrap" style={{ color: textColor }}>
                  {label}
                </span>
              </LinkComponent>
            ))}
          </div>

          {/* RIGHT — CTA + HAMBURGER */}
          <div className="flex items-center justify-end pr-4">
            <div className="hidden md:block">
              <LinkComponent
                href={CTA_HREF}
                className="px-5 py-2 rounded-md bg-gradient-to-r from-[#00C875] to-[#00AFA3] text-white hover:opacity-90 font-medium text-[18px] md:text-[22px]"
                onClick={closeMobile}
              >
                <span>Get My Profile Snapshot</span>
              </LinkComponent>
            </div>

            {/* MOBILE MENU BUTTON */}
            <div className="md:hidden">
              <button
                onClick={toggleMobile}
                aria-label="Toggle menu"
                aria-expanded={mobileOpen}
                aria-controls={mobilePanelId}
                className={cn(
                  "inline-flex items-center justify-center rounded-full p-2",
                  scrolled
                    ? "bg-white/70 border border-black/10"
                    : "bg-white/15 border border-white/20",
                )}
                style={{ color: textColor }}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  {mobileOpen ? (
                    <>
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </>
                  ) : (
                    <>
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* MOBILE MENU PANEL */}
      <div
        id={mobilePanelId}
        className={cn(
          "fixed inset-0 z-40 md:hidden transition-all duration-300",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        style={{ top: `${HEADER_HEIGHT}px` }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={closeMobile}
        />
        
        {/* Menu content with glassy effect */}
        <div
          className={cn(
            "relative backdrop-blur-xl bg-white/80 h-full overflow-y-auto transition-transform duration-300 border-r border-white/20",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
          style={{ maxWidth: "85vw" }}
        >
          <div className="px-6 py-8 space-y-3">
            {/* Menu items with glassy chips */}
            {items.map(({ href, label, onClick }) => (
              <LinkComponent
                key={href + label}
                href={href}
                className={cn(
                  "block w-full px-5 py-3 rounded-full text-center font-medium transition-colors border",
                  isActive(href)
                    ? "bg-[#00C875]/20 text-[#00C875] border-[#00C875]/40 shadow-sm"
                    : "bg-white/40 text-[#003366] hover:bg-white/60 border-white/30"
                )}
                onClick={() => {
                  onClick?.();
                  closeMobile();
                }}
              >
                {label}
              </LinkComponent>
            ))}
            
            {/* Mobile CTA */}
            <div className="pt-4">
              <LinkComponent
                href={CTA_HREF}
                className="block w-full px-5 py-3 rounded-full bg-gradient-to-r from-[#00C875] to-[#00AFA3] text-white text-center font-medium hover:opacity-90 shadow-lg"
                onClick={closeMobile}
              >
                Get My Profile Snapshot
              </LinkComponent>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}