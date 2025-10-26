// src/components/footer/footer.tsx
"use client";

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{ background: '#EFEFEF', marginTop: '80px' }} className="w-full">
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        {/* Top Section - Logo and Navigation */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 pb-8 border-b border-black/10">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <span
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#A3A3A3',
                letterSpacing: '-0.02em',
                fontFamily: `'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif`,
              }}
            >
              ADMIT55
            </span>
            <img
              src="/logo/admit55logo.webp"
              alt="Admit55"
              style={{
                height: '40px',
                width: 'auto',
              }}
            />
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-wrap gap-x-8 gap-y-4">
            <Link
              href="/about"
              className="text-sm font-medium transition-colors"
              style={{ color: '#1d1d1f' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#A3A3A3')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#1d1d1f')}
            >
              About
            </Link>
            <Link
              href="/tools"
              className="text-sm font-medium transition-colors"
              style={{ color: '#1d1d1f' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#A3A3A3')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#1d1d1f')}
            >
              Tools
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium transition-colors"
              style={{ color: '#1d1d1f' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#A3A3A3')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#1d1d1f')}
            >
              Pricing
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium transition-colors"
              style={{ color: '#1d1d1f' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#A3A3A3')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#1d1d1f')}
            >
              Contact
            </Link>
          </nav>
        </div>

        {/* Bottom Section - Copyright and Legal */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8">
          <p
            className="text-xs"
            style={{ color: '#86868B' }}
          >
            © {currentYear} Admit55. All rights reserved.
          </p>

          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="text-xs transition-colors"
              style={{ color: '#86868B' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#1d1d1f')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#86868B')}
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-xs transition-colors"
              style={{ color: '#86868B' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#1d1d1f')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#86868B')}
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}