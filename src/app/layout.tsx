import type { Metadata } from "next";
import "./globals.css";
import { AnonProvider } from "@/context/AnonContext";
import { ToastProvider } from "@/context/ToastContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";

export const metadata: Metadata = {
  title: "RGPV Gossip Point — Pin it. Don't sign it.",
  description: "Anonymous campus feeds and 3-minute blind date live chat for RGPV/UIT students. No signup, no login.",
  keywords: ["RGPV", "UIT", "gossip", "anonymous", "campus", "blind date", "bhopal"],
  openGraph: {
    title: "RGPV Gossip Point",
    description: "Your campus, your voice, zero login.",
    type: "website",
  },
};

function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <AnonProvider>
      <ToastProvider>
        <TopBar />
        <main className="flex-1 max-w-md mx-auto w-full pb-20">
          {children}
        </main>
        <BottomNav />
      </ToastProvider>
    </AnonProvider>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#FBFBF7" />
      </head>
      <body className="min-h-full flex flex-col bg-paper text-ink font-body">
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
