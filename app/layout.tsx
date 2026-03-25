import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "DisasterLeadTracker India",
  description: "AI-Powered Disaster Incident Monitoring & Business Lead Generation Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-background text-foreground flex flex-col">
        <Navbar />
        <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6">
          {children}
        </main>
      </body>
    </html>
  );
}
