'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, AlertTriangle, Users, Map,
  Sparkles, Bell, Menu, X,
} from 'lucide-react';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/events',    label: 'Pipeline',  icon: AlertTriangle },
  { href: '/leads',     label: 'Leads',     icon: Users },
  { href: '/map',       label: 'Map',       icon: Map },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close drawer whenever the route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (open) document.body.classList.add('no-scroll');
    else      document.body.classList.remove('no-scroll');
    return () => document.body.classList.remove('no-scroll');
  }, [open]);

  return (
    <>
      <nav className="sticky top-0 z-50 w-full" style={{ background: 'var(--navbar)' }}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-6">
          {/* Brand — compact on mobile, full label from sm+ */}
          <Link href="/dashboard" className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#F5EFE6' }}
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#3B2416' }} />
            </div>
            <div className="leading-tight min-w-0">
              <p className="font-display text-base sm:text-lg font-semibold tracking-tight truncate" style={{ color: '#F5EFE6' }}>
                AVANI
              </p>
              <p className="hidden sm:block text-[10px] uppercase tracking-[0.25em]" style={{ color: '#C9B79C' }}>
                Lead Studio
              </p>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div
            className="hidden md:flex items-center gap-1 rounded-full p-1"
            style={{ background: 'rgba(245, 239, 230, 0.08)' }}
          >
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className="flex items-center gap-2 px-3 lg:px-4 py-2 rounded-full text-sm font-medium transition-all"
                  style={
                    active
                      ? { background: '#F5EFE6', color: '#2E1B12' }
                      : { color: '#E6D7C2' }
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right cluster: bell + avatar (always), hamburger (mobile only) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              aria-label="Notifications"
              className="touch-icon-btn relative w-10 h-10"
              style={{ background: 'rgba(245, 239, 230, 0.08)', color: '#E6D7C2' }}
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full" style={{ background: '#C97B3F' }} />
            </button>

            <div
              className="hidden sm:flex w-10 h-10 rounded-full items-center justify-center font-display font-semibold text-sm"
              style={{ background: '#9C6B4A', color: '#F5EFE6' }}
              aria-label="Account"
            >
              A
            </div>

            <button
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => setOpen(true)}
              className="md:hidden touch-icon-btn w-10 h-10"
              style={{ background: 'rgba(245, 239, 230, 0.08)', color: '#F5EFE6' }}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-[60]"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0"
            style={{ background: 'rgba(46, 27, 18, 0.55)', backdropFilter: 'blur(4px)' }}
          />

          {/* Panel — slides from right, full height */}
          <div
            className="absolute top-0 right-0 h-full w-[88%] max-w-sm shadow-soft-lg flex flex-col"
            style={{ background: 'var(--navbar)' }}
          >
            <div className="flex items-center justify-between px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: '#F5EFE6' }}>
                  <Sparkles className="w-5 h-5" style={{ color: '#3B2416' }} />
                </div>
                <div className="leading-tight">
                  <p className="font-display text-lg font-semibold" style={{ color: '#F5EFE6' }}>AVANI</p>
                  <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: '#C9B79C' }}>Lead Studio</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="touch-icon-btn w-10 h-10"
                style={{ background: 'rgba(245, 239, 230, 0.08)', color: '#F5EFE6' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-6">
              <ul className="flex flex-col gap-1">
                {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || pathname.startsWith(href + '/');
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-base font-medium transition-colors"
                        style={
                          active
                            ? { background: '#F5EFE6', color: '#2E1B12' }
                            : { color: '#E6D7C2' }
                        }
                      >
                        <Icon className="w-5 h-5" />
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-6 px-4 py-4 rounded-2xl" style={{ background: 'rgba(245, 239, 230, 0.06)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-display font-semibold text-lg" style={{ background: '#9C6B4A', color: '#F5EFE6' }}>
                    A
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#F5EFE6' }}>Account</p>
                    <p className="text-xs" style={{ color: '#C9B79C' }}>parikshitkaushal0712@…</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
