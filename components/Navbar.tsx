import Link from "next/link";
import { Flame, Map, RefreshCw, BarChart2 } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="w-full h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <Flame className="text-accentRed w-6 h-6" />
        <Link href="/dashboard" className="text-lg font-bold text-foreground">
          FireLeadTracker India
        </Link>
      </div>

      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-textSecondary hover:text-foreground transition-colors">
          <Map className="w-4 h-4" />
          <span className="text-sm font-medium">Dashboard</span>
        </Link>
        <Link href="/analytics" className="flex items-center gap-2 text-textSecondary hover:text-foreground transition-colors">
          <BarChart2 className="w-4 h-4" />
          <span className="text-sm font-medium">Analytics</span>
        </Link>
        <button className="flex items-center gap-2 bg-accentBlue/10 text-accentBlue px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-accentBlue/20 transition-colors">
          <RefreshCw className="w-4 h-4" />
          Manual Scrape
        </button>
      </div>
    </nav>
  );
}
