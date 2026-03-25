'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, LayoutDashboard, AlertTriangle, Users, Map } from 'lucide-react';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/events',    label: 'Events',     icon: AlertTriangle },
  { href: '/leads',     label: 'Leads',      icon: Users },
  { href: '/map',       label: 'Map',        icon: Map },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="w-full h-16 bg-card border-b border-border flex items-center justify-between px-8 sticky top-0 z-50">
      {/* Brand */}
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-accentBlue rounded-lg flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-bold text-foreground tracking-tight">DisasterLeadTracker</span>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-2">
        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-accentBlue/15 text-accentBlue'
                  : 'text-textSecondary hover:text-foreground hover:bg-background'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
