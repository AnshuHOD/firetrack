import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Avani Lead Studio",
  description: "A luxury enterprise lead intelligence platform — built for modern Indian businesses.",
};

// Mobile viewport tuning — locks zoom-on-input on iOS and respects notches
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#3B2416",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 w-full">
          {children}
        </main>
        <footer
          className="border-t mt-12 sm:mt-16"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
        >
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-10 flex flex-col md:flex-row md:items-end md:justify-between gap-5 sm:gap-6">
            <div>
              <p className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">Avani Lead Studio</p>
              <p className="text-sm text-textSecondary mt-2 max-w-md">
                A luxury enterprise CRM and lead management platform built for modern Indian businesses.
              </p>
            </div>
            <div className="text-xs text-textMuted flex flex-wrap gap-x-6 gap-y-1">
              <span>© {new Date().getFullYear()} Avani Enterprises</span>
              <span>Made in India</span>
              <span>v1.0</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
