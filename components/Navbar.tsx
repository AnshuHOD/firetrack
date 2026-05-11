'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, AlertTriangle, Users, Map, Sparkles, Bell, Search } from 'lucide-react';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/events',    label: 'Pipeline',  icon: AlertTriangle },
  { href: '/leads',     label: 'Leads',     icon: Users },
  { href: '/map',       label: 'Map',       icon: Map },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full" style={{ background: 'var(--navbar)' }}>
      <div className="max-w-[1600px] mx-auto px-6 md:px-10 h-20 flex items-center justify-between gap-6">
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: '#F5EFE6' }}
          >
            <Sparkles className="w-5 h-5" style={{ color: '#3B2416' }} />
          </div>
          <div className="leading-tight">
            <p className="font-display text-lg font-semibold tracking-tight" style={{ color: '#F5EFE6' }}>
              AVANI
            </p>
            <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: '#C9B79C' }}>
              Lead Studio
            </p>
          </div>
        </Link>

        {/* Nav links — pill group */}
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
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all"
                style={
                  active
                    ? { background: '#F5EFE6', color: '#2E1B12' }
                    : { color: '#E6D7C2' }
                }
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          <button
            aria-label="Search"
            className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full transition-all"
            style={{ background: 'rgba(245, 239, 230, 0.08)', color: '#E6D7C2' }}
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            aria-label="Notifications"
            className="relative flex items-center justify-center w-10 h-10 rounded-full transition-all"
            style={{ background: 'rgba(245, 239, 230, 0.08)', color: '#E6D7C2' }}
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full" style={{ background: '#C97B3F' }} />
          </button>
          <div
            className="ml-2 w-10 h-10 rounded-full flex items-center justify-center font-display font-semibold text-sm"
            style={{ background: '#9C6B4A', color: '#F5EFE6' }}
            aria-label="Account"
          >
            A
          </div>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="md:hidden border-t flex items-center justify-around px-2 py-2"
        style={{ borderColor: 'rgba(245, 239, 230, 0.08)' }}>
        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full text-xs"
              style={active ? { color: '#F5EFE6' } : { color: '#C9B79C' }}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px]">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
